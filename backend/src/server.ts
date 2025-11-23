/**
 * MARGAZ KONTROL SİSTEMİ - BACKEND SİMÜLASYON SERVERİ
 *
 * Bu dosya, gaz tankı seviye izleme sisteminin arka plan simülasyonunu yapar.
 * Gerçek donanım olmadan, yazılımsal olarak tank seviyesini simüle eder.
 *
 * SUNUM İÇİN ÖNEMLİ NOTLAR:
 * - Bu sistem gerçek bir tank sensöründen veri okumaz, yazılımsal simülasyon yapar
 * - Gerçek sistemde sensör bağlantısı olduğunda bu simülasyon yerine
 *   gerçek sensor verisi kullanılacak
 * - WebSocket teknolojisi ile gerçek zamanlı veri iletimi yapılıyor
 */

import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import path from 'path';

// ============================================================================
// YAPILANDIRMA AYARLARI
// ============================================================================

const PORT = 3000; // Backend serverımızın çalışacağı port
const SIMULATION_INTERVAL = 2000; // Simülasyon güncelleme süresi (2 saniye)

/**
 * ÇOKLU ALARM SEVİYELERİ
 *
 * 4 farklı seviye tanımı:
 * - CRITICAL: %90+ Kritik seviye (acil müdahale gerekli)
 * - HIGH: %80-90 Yüksek seviye (dikkat gerekli)
 * - WARNING: %70-80 Uyarı seviyesi (izleme gerekli)
 * - LOW: %20 altı Düşük seviye (dolum gerekli)
 */
const ALARM_LEVELS = {
  CRITICAL: 90,  // Kritik - Kırmızı
  HIGH: 80,      // Yüksek - Turuncu
  WARNING: 70,   // Uyarı - Sarı
  LOW: 20        // Düşük - Mavi (dolum zamanı)
};

// ============================================================================
// SİMÜLASYON DEĞİŞKENLERİ
// ============================================================================

/**
 * Tank seviyesi verisi
 * Gerçek sistemde bu veri sensörden okunacak,
 * simülasyonda yazılımsal olarak üretilecek
 *
 * GERÇEK DÜNYA VERİLERİ - ENDÜSTRİYEL TANKER FİLOSU:
 * - Küçük Tanker (3-5 ton): Dolum 20-30 dakika
 * - Orta Tanker (10-15 ton): Dolum 45-60 dakika
 * - Büyük Tanker (20-30 ton): Dolum 90-120 dakika
 * - Dolum Hızı: Dakikada %3-5 artış
 * - Boşaltma Hızı: Dakikada %2-4 azalış
 */
let tankLevel = 15; // Başlangıç seviyesi %15 (tanker boşken dolum başlıyor)

/**
 * Alarm tipi - hangi seviye alarm verdi
 * null: Alarm yok
 * 'LOW': Düşük seviye (dolum gerekli)
 * 'WARNING': Uyarı seviyesi
 * 'HIGH': Yüksek seviye
 * 'CRITICAL': Kritik seviye
 */
type AlarmType = 'LOW' | 'WARNING' | 'HIGH' | 'CRITICAL' | null;
let currentAlarmType: AlarmType = null;

/**
 * Alarm durumu (geriye dönük uyumluluk için)
 */
let isAlarmActive = false;

/**
 * Son alarm zamanı (spam önleme için)
 */
let lastAlarmTime = 0;

/**
 * GEÇMİŞ VERİ KAYIT SİSTEMİ
 *
 * Son 24 saatin verilerini saklar (grafik için)
 * Her kayıt: { timestamp, level, alarmType }
 *
 * Gerçek sistemde bu veriler veritabanına kaydedilecek
 */
interface TankReading {
  timestamp: Date;
  level: number;
  alarmType: AlarmType;
}

const tankHistory: TankReading[] = [];
const MAX_HISTORY_SIZE = 720; // 24 saat * 30 kayıt/saat (2 saniyede bir)

/**
 * TAHMİN İÇİN DEĞERLER
 * Son okumaları kullanarak seviye değişim hızını hesapla
 */
let previousLevel = tankLevel;
let usageRate = 0; // % değişim/saat

/**
 * SİMÜLASYON MODU AYARLARI - TANKER FİLOSU İÇİN OPTİMİZE EDİLDİ
 *
 * GERÇEK DÜNYA - ENDÜSTRİYEL TANKER:
 * - Dolum: Dakikada %3-5 artış (20-30 dakikada dolu)
 * - Boşaltma: Dakikada %2-4 azalış (30-50 dakikada boş)
 *
 * DEMO MODU:
 * - NORMAL: Gerçekçi hız (tanker dolumu 30+ dakika)
 * - FAST: Hızlandırılmış (demo için ~3-5 dakikada görünür değişim)
 */
type DemoSpeed = 'NORMAL' | 'FAST';
type UsageTrend = 'CONSUMING' | 'FILLING' | 'MIXED';

const DEMO_SPEED = 'FAST' as DemoSpeed; // 'FAST' = Demo için hızlandırılmış
const USAGE_TREND = 'FILLING' as UsageTrend; // 'FILLING' = Tanker dolum işlemi simülasyonu

// Trend hızları (saatlik değişim yüzdesi)
const TREND_RATES: Record<UsageTrend, number> = {
  CONSUMING: -150.0,  // Boşaltma: Dakikada %2.5 = Saatte %150 (hızlı boşaltma)
  FILLING: 180.0,     // Dolum: Dakikada %3 = Saatte %180 (tanker dolum)
  MIXED: 0            // Karışık (kullanılmıyor)
};

// ============================================================================
// EXPRESS VE WEBSOCKET SUNUCU KURULUMU
// ============================================================================

// Express uygulaması oluştur
const app = express();

// CORS (Cross-Origin Resource Sharing) - Frontend'in backend'e erişmesini sağlar
app.use(cors());

// JSON verilerini parse etmek için
app.use(express.json());

// Static dosyaları (HTML, CSS, JS) serve et
app.use(express.static(path.join(__dirname, '../../frontend')));

// HTTP sunucusu oluştur
const server = createServer(app);

// WebSocket sunucusu oluştur (gerçek zamanlı veri iletimi için)
const wss = new WebSocketServer({ server });

// ============================================================================
// SİMÜLASYON LOGİĞİ - GAZ TANKI SEVİYESİ HESAPLAMA
// ============================================================================

/**
 * Tank seviyesini simüle eder - GERÇEKÇİ VERSİYON
 *
 * GERÇEK SİSTEM vs SİMÜLASYON:
 * - Gerçek sistemde: Sensörden ADC (Analog-Digital Converter) ile veri okunur
 * - Simülasyonda: Gerçekçi tüketim/dolum hızıyla değişim üretilir
 *
 * GERÇEK DÜNYA VERİLERİ:
 * - Evsel LPG tüpü: Günde %1.6 azalır (60 gün ömür)
 * - Saatte: %0.06 değişim
 * - Demo için 60x hızlandırılmış: Saatte %2-3 değişim
 *
 * Bu fonksiyon her 2 saniyede bir çağrılır ve tank seviyesini günceller
 */
function simulateTankLevel(): void {
  // Önceki seviyeyi kaydet (tahmin için)
  previousLevel = tankLevel;

  // Trend bazlı değişim hesapla (saatlik oran → 2 saniyelik)
  const trendRate = TREND_RATES[USAGE_TREND]; // Saatlik %
  const trendChange = (trendRate / 3600) * (SIMULATION_INTERVAL / 1000); // 2 saniyelik değişim

  // Küçük rastgele gürültü ekle (sensör okumaları gibi)
  // Gerçek sensörler ±%0.1-0.5 sapma gösterir
  const noise = (Math.random() - 0.5) * 0.15; // ±%0.075 rastgele sapma

  // Toplam değişim
  let change = trendChange + noise;

  // Hızlı demo modu (opsiyonel)
  if (DEMO_SPEED === 'FAST') {
    change *= 5; // 5x hızlandır
  }

  // Yeni seviyeyi hesapla
  tankLevel += change;

  // Seviyenin mantıklı sınırlarda kalmasını sağla (0-100 arası)
  if (tankLevel < 0) tankLevel = 0;
  if (tankLevel > 100) tankLevel = 100;

  // Seviyeyi 2 ondalık basamağa yuvarla (örn: 55.67)
  tankLevel = Math.round(tankLevel * 100) / 100;

  // Kullanım hızını hesapla (% değişim/saat)
  const levelChange = tankLevel - previousLevel;
  usageRate = (levelChange / (SIMULATION_INTERVAL / 1000)) * 3600; // saat başına

  // Geçmiş verilere ekle
  saveTankReading();

  // Detaylı log (sadece değişim varsa)
  if (Math.abs(levelChange) > 0.001) {
    console.log(`[SİMÜLASYON] Seviye: %${tankLevel.toFixed(2)} | Değişim: ${levelChange > 0 ? '+' : ''}${levelChange.toFixed(4)}% | Hız: ${usageRate.toFixed(3)}%/saat | Trend: ${USAGE_TREND}`);
  }
}

/**
 * Mevcut tank okumalarını geçmiş verilere kaydet
 * Grafik ve trend analizi için kullanılır
 */
function saveTankReading(): void {
  const reading: TankReading = {
    timestamp: new Date(),
    level: tankLevel,
    alarmType: currentAlarmType
  };

  tankHistory.push(reading);

  // Maksimum boyutu aşarsa en eski kaydı sil
  if (tankHistory.length > MAX_HISTORY_SIZE) {
    tankHistory.shift(); // İlk elemanı çıkar
  }
}

// ============================================================================
// ALARM SİSTEMİ
// ============================================================================

/**
 * Alarm durumunu kontrol eder - ÇOKLU SEVİYE DESTEĞİ
 *
 * 4 farklı alarm seviyesi kontrol edilir:
 * - CRITICAL: %90+ (Kritik - Acil müdahale)
 * - HIGH: %80-90 (Yüksek - Dikkat gerekli)
 * - WARNING: %70-80 (Uyarı - İzleme gerekli)
 * - LOW: %20 altı (Düşük - Dolum zamanı)
 *
 * GERÇEK SİSTEMDE:
 * - SMS, email veya push notification gönderilebilir
 * - Siren veya ışık sistemi tetiklenebilir
 * - Otomatik kapama valfi aktive edilebilir
 */
function checkAlarmStatus(): void {
  const previousAlarmType = currentAlarmType;

  // Seviye kontrolü - Öncelik sırasına göre (en yüksekten en düşüğe)
  if (tankLevel >= ALARM_LEVELS.CRITICAL) {
    currentAlarmType = 'CRITICAL';
    isAlarmActive = true;
  } else if (tankLevel >= ALARM_LEVELS.HIGH) {
    currentAlarmType = 'HIGH';
    isAlarmActive = true;
  } else if (tankLevel >= ALARM_LEVELS.WARNING) {
    currentAlarmType = 'WARNING';
    isAlarmActive = false; // Uyarı seviyesi alarm olarak sayılmaz
  } else if (tankLevel <= ALARM_LEVELS.LOW) {
    currentAlarmType = 'LOW';
    isAlarmActive = false; // Düşük seviye bilgi amaçlı
  } else {
    currentAlarmType = null;
    isAlarmActive = false;
  }

  // Alarm tipi değiştiyse konsola yaz
  if (currentAlarmType !== previousAlarmType) {
    logAlarmChange(previousAlarmType, currentAlarmType);
  }
}

/**
 * Alarm seviyesi değişikliklerini loga yaz
 */
function logAlarmChange(oldType: AlarmType, newType: AlarmType): void {
  const now = new Date().toLocaleTimeString('tr-TR');

  if (newType === 'CRITICAL') {
    console.log('\n🔴 ═══════════════════════════════════════════════════════');
    console.log(`   [${now}] KRİTİK ALARM!`);
    console.log(`   Tank seviyesi: %${tankLevel.toFixed(2)}`);
    console.log(`   Eşik: %${ALARM_LEVELS.CRITICAL}`);
    console.log('   ⚠️  ACİL MÜDAHALE GEREKLİ!');
    console.log('═══════════════════════════════════════════════════════ 🔴\n');
  } else if (newType === 'HIGH') {
    console.log('\n🟠 ═══════════════════════════════════════════════════════');
    console.log(`   [${now}] YÜKSEK SEVİYE ALARM!`);
    console.log(`   Tank seviyesi: %${tankLevel.toFixed(2)}`);
    console.log(`   Eşik: %${ALARM_LEVELS.HIGH}`);
    console.log('   ⚠️  DİKKAT GEREKLİ!');
    console.log('═══════════════════════════════════════════════════════ 🟠\n');
  } else if (newType === 'WARNING') {
    console.log(`\n🟡 [${now}] UYARI: Tank seviyesi %${tankLevel.toFixed(2)} (Eşik: %${ALARM_LEVELS.WARNING})\n`);
  } else if (newType === 'LOW') {
    console.log(`\n🔵 [${now}] BİLGİ: Tank seviyesi düşük %${tankLevel.toFixed(2)} - Dolum zamanı yaklaşıyor\n`);
  } else if (newType === null && oldType !== null) {
    console.log(`\n✅ [${now}] Seviye normale döndü: %${tankLevel.toFixed(2)}\n`);
  }
}

// ============================================================================
// WEBSOCKET BAĞLANTI YÖNETİMİ
// ============================================================================

/**
 * WebSocket ile bağlanan her client için çalışır
 *
 * WebSocket nedir?
 * - HTTP'nin aksine çift yönlü, sürekli bir bağlantıdır
 * - Server istediği zaman client'a veri gönderebilir
 * - Gerçek zamanlı uygulamalar için idealdir (chat, canlı izleme, vb.)
 */
wss.on('connection', (ws: WebSocket) => {
  console.log('✅ Yeni client bağlandı');

  // Bağlanan client'a hoşgeldin mesajı gönder
  ws.send(JSON.stringify({
    type: 'connection',
    message: 'Margaz Kontrol Sistemi\'ne bağlandınız',
    timestamp: new Date().toISOString()
  }));

  // Mevcut durumu hemen gönder
  sendDataToClient(ws);

  // Client bağlantıyı kapattığında
  ws.on('close', () => {
    console.log('❌ Client bağlantısı kesildi');
  });

  // Hata durumunda
  ws.on('error', (error) => {
    console.error('WebSocket hatası:', error);
  });
});

// ============================================================================
// VERİ GÖNDERME FONKSİYONLARI
// ============================================================================

/**
 * Belirli bir client'a tank verisi gönder - GELİŞMİŞ VERSİYON
 */
function sendDataToClient(ws: WebSocket): void {
  if (ws.readyState === WebSocket.OPEN) {
    // Tahmine dayalı boşalma/dolma zamanı hesapla
    const prediction = calculatePrediction();

    const data = {
      type: 'tank_data',
      level: tankLevel,
      isAlarmActive: isAlarmActive,

      // ÇOKLU ALARM SEVİYELERİ
      alarmType: currentAlarmType,
      alarmLevels: ALARM_LEVELS,

      // GERİYE DÖNÜK UYUMLULUK
      threshold: ALARM_LEVELS.HIGH,

      timestamp: new Date().toISOString(),

      // DURUM BİLGİSİ
      status: getStatusText(),
      message: getStatusMessage(),

      // TAHMİN VERİLERİ
      usageRate: Math.round(usageRate * 100) / 100,
      prediction: prediction,

      // GEÇMİŞ VERİLER (Son 100 kayıt - grafik için)
      history: tankHistory.slice(-100).map(r => ({
        timestamp: r.timestamp.toISOString(),
        level: r.level,
        alarmType: r.alarmType
      }))
    };

    ws.send(JSON.stringify(data));
  }
}

/**
 * Durum metnini döndür
 */
function getStatusText(): string {
  switch (currentAlarmType) {
    case 'CRITICAL': return 'KRİTİK';
    case 'HIGH': return 'YÜKSEK';
    case 'WARNING': return 'UYARI';
    case 'LOW': return 'DÜŞÜK';
    default: return 'NORMAL';
  }
}

/**
 * Durum mesajını döndür
 */
function getStatusMessage(): string {
  switch (currentAlarmType) {
    case 'CRITICAL':
      return `🔴 KRİTİK! Tank seviyesi %${tankLevel.toFixed(1)} - Acil müdahale gerekli!`;
    case 'HIGH':
      return `🟠 YÜKSEK! Tank seviyesi %${tankLevel.toFixed(1)} - Dikkat gerekli!`;
    case 'WARNING':
      return `🟡 UYARI: Tank seviyesi %${tankLevel.toFixed(1)} - İzleme gerekli`;
    case 'LOW':
      return `🔵 BİLGİ: Tank seviyesi %${tankLevel.toFixed(1)} - Dolum zamanı yaklaşıyor`;
    default:
      return `✅ Normal: Tank seviyesi %${tankLevel.toFixed(1)}`;
  }
}

/**
 * TAHMİN MOTORU
 * Mevcut kullanım hızına göre tank ne zaman dolacak/boşalacak?
 */
function calculatePrediction(): {
  timeToEmpty: string | null;
  timeToFull: string | null;
  emptyDate: string | null;
  fullDate: string | null;
} {
  // Yeterli veri yoksa tahmin yapma
  if (tankHistory.length < 10 || Math.abs(usageRate) < 0.1) {
    return {
      timeToEmpty: null,
      timeToFull: null,
      emptyDate: null,
      fullDate: null
    };
  }

  let timeToEmpty: string | null = null;
  let timeToFull: string | null = null;
  let emptyDate: string | null = null;
  let fullDate: string | null = null;

  // Boşalma tahmini (seviye azalıyorsa)
  if (usageRate < 0) {
    const hoursToEmpty = Math.abs(tankLevel / usageRate);
    const msToEmpty = hoursToEmpty * 3600000;
    const emptyDateTime = new Date(Date.now() + msToEmpty);

    timeToEmpty = formatDuration(hoursToEmpty);
    emptyDate = emptyDateTime.toLocaleString('tr-TR');
  }

  // Dolma tahmini (seviye artıyorsa)
  if (usageRate > 0) {
    const hoursToFull = (100 - tankLevel) / usageRate;
    const msToFull = hoursToFull * 3600000;
    const fullDateTime = new Date(Date.now() + msToFull);

    timeToFull = formatDuration(hoursToFull);
    fullDate = fullDateTime.toLocaleString('tr-TR');
  }

  return { timeToEmpty, timeToFull, emptyDate, fullDate };
}

/**
 * Süreyi okunabilir formata çevir
 */
function formatDuration(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)} dakika`;
  } else if (hours < 24) {
    return `${Math.round(hours)} saat`;
  } else {
    const days = Math.floor(hours / 24);
    const remainingHours = Math.round(hours % 24);
    return `${days} gün ${remainingHours} saat`;
  }
}

/**
 * Tüm bağlı client'lara veri gönder (broadcast)
 */
function broadcastData(): void {
  wss.clients.forEach((client) => {
    sendDataToClient(client);
  });
}

// ============================================================================
// SİMÜLASYON DÖNGÜSÜ
// ============================================================================

/**
 * Ana simülasyon döngüsü
 * Her SIMULATION_INTERVAL (2 saniye) süresinde bir çalışır
 *
 * İŞLEYİŞ:
 * 1. Tank seviyesini simüle et (sensör okuma simülasyonu)
 * 2. Alarm durumunu kontrol et
 * 3. Tüm bağlı client'lara güncel veriyi gönder
 */
setInterval(() => {
  simulateTankLevel();  // 1. Seviye simülasyonu
  checkAlarmStatus();   // 2. Alarm kontrolü
  broadcastData();      // 3. Veriyi client'lara gönder
}, SIMULATION_INTERVAL);

// ============================================================================
// REST API ENDPOINTLERİ (Opsiyonel)
// ============================================================================

/**
 * GET /api/status
 * Mevcut tank durumunu JSON olarak döner
 * WebSocket kullanmayan client'lar için alternatif
 */
app.get('/api/status', (req, res) => {
  res.json({
    level: tankLevel,
    isAlarmActive: isAlarmActive,
    alarmType: currentAlarmType,
    alarmLevels: ALARM_LEVELS,
    threshold: ALARM_LEVELS.HIGH, // Geriye dönük uyumluluk
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /api/threshold
 * Alarm eşik değerini değiştirmek için
 * Body: { "threshold": 85 }
 */
app.post('/api/threshold', (req, res) => {
  const newThreshold = req.body.threshold;

  if (typeof newThreshold === 'number' && newThreshold >= 0 && newThreshold <= 100) {
    // ALARM_THRESHOLD = newThreshold; // Bu değişken const olduğu için değiştirilemez
    res.json({
      success: true,
      message: 'Eşik değeri güncellendi',
      newThreshold
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'Geçersiz eşik değeri (0-100 arası olmalı)'
    });
  }
});

/**
 * GET /
 * Ana sayfa - Frontend'i serve eder
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

// ============================================================================
// SUNUCU BAŞLATMA
// ============================================================================

server.listen(PORT, () => {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║                                                           ║');
  console.log('║        🏭 MARGAZ KONTROL SİSTEMİ - SİMÜLASYON 🏭         ║');
  console.log('║                                                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`🌐 Backend Server: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket Server: ws://localhost:${PORT}`);
  console.log(`🚨 Alarm Seviyeleri: 🔵${ALARM_LEVELS.LOW}% 🟡${ALARM_LEVELS.WARNING}% 🟠${ALARM_LEVELS.HIGH}% 🔴${ALARM_LEVELS.CRITICAL}%`);
  console.log(`⏱️  Güncelleme Aralığı: ${SIMULATION_INTERVAL}ms (${SIMULATION_INTERVAL / 1000} saniye)`);
  console.log('');
  console.log('📊 SİMÜLASYON AYARLARI:');
  const speedLabel = DEMO_SPEED === 'FAST' ? '⚡ HIZLI (Demo)' : '🐢 NORMAL (Gerçekçi)';
  console.log(`   Mod: ${speedLabel}`);
  console.log(`   Trend: ${USAGE_TREND} (${TREND_RATES[USAGE_TREND]}%/saat)`);
  console.log(`   Başlangıç Seviyesi: %${tankLevel}`);
  console.log('');
  console.log('📝 GERÇEK DÜNYA KARŞILAŞTIRMASI:');
  console.log(`   • Evsel LPG Tüpü: Günde %1.6 azalır (60 gün ömür)`);
  console.log(`   • Bu simülasyon: Saatte ~${Math.abs(TREND_RATES[USAGE_TREND])}% ${USAGE_TREND === 'CONSUMING' ? 'azalır' : 'artar'}`);
  console.log(`   • Hızlandırma: ${Math.round(Math.abs(TREND_RATES[USAGE_TREND]) / 0.06)}x (görsel demo için)`);
  console.log('');
  console.log('💡 Frontend\'i görmek için tarayıcınızda http://localhost:3000 adresine gidin');
  console.log('');
  console.log('───────────────────────────────────────────────────────────');
  console.log('');
});

/**
 * SUNUM İÇİN AÇIKLAMALAR:
 *
 * 1. SİMÜLASYON vs GERÇEK SİSTEM:
 *    - Bu kod gerçek sensör okumaz, seviyeyi matematik ile simüle eder
 *    - Gerçek sistemde "simulateTankLevel" fonksiyonu yerine sensör okuma
 *      fonksiyonu olacak (örn: ADC okuma, I2C/SPI protokolü, vb.)
 *
 * 2. WEBSOCKET KULLANIMI:
 *    - Gerçek zamanlı veri iletimi için WebSocket kullanılıyor
 *    - Her 2 saniyede güncel veri otomatik olarak frontend'e gönderiliyor
 *    - Sayfa yenilemeye gerek yok!
 *
 * 3. ALARM SİSTEMİ:
 *    - %80 eşiği aşıldığında otomatik alarm
 *    - Konsol ve frontend'de uyarı gösterimi
 *    - Gerçek sistemde buraya SMS, email, veya donanım kontrolü eklenebilir
 *
 * 4. GENİŞLETİLEBİLİRLİK:
 *    - Veritabanı eklenebilir (geçmiş veriler için)
 *    - Çoklu tank desteği eklenebilir
 *    - Kullanıcı yönetimi ve authentication eklenebilir
 *    - Raporlama ve grafik özellikleri eklenebilir
 */
