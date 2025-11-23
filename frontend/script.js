/**
 * MARGAZ KONTROL SİSTEMİ - FRONTEND JAVASCRIPT
 *
 * Bu dosya backend ile WebSocket bağlantısı kurarak gerçek zamanlı
 * veri alır ve arayüzü günceller.
 *
 * SUNUM İÇİN ÖNEMLİ NOTLAR:
 * - WebSocket ile çift yönlü iletişim (HTTP'den farkı: sürekli bağlantı)
 * - Sayfa yenilemeye gerek yok, veriler otomatik güncellenir
 * - Gerçek zamanlı tank seviyesi gösterimi
 * - Alarm durumuna göre dinamik görsel değişiklikler
 */

// ============================================================================
// GLOBAL DEĞİŞKENLER
// ============================================================================

/**
 * WebSocket bağlantı nesnesi
 * Bu nesne üzerinden backend ile iletişim kurulur
 */
let socket = null;

/**
 * Yeniden bağlanma timer'ı
 * Bağlantı kesilirse otomatik yeniden bağlanmak için
 */
let reconnectTimer = null;

/**
 * WebSocket sunucu adresi
 * Gerçek sistemde bu adres yapılandırma dosyasından okunabilir
 */
const WS_URL = `ws://${window.location.hostname}:${window.location.port || 3000}`;

// ============================================================================
// DOM ELEMENTLERİ
// ============================================================================

/**
 * Sık kullanılan HTML elementlerini değişkenlere atıyoruz
 * Bu, performans açısından daha iyi ve kod okunabilirliğini artırır
 */

// Tank gösterge elementleri
const tankLiquid = document.getElementById('tankLiquid');
const tankPercentage = document.getElementById('tankPercentage');

// Durum gösterge elementleri
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const statusCard = document.getElementById('statusCard');
const statusBadge = document.getElementById('statusBadge');
const statusMessage = document.getElementById('statusMessage');

// Veri gösterge elementleri
const levelValue = document.getElementById('levelValue');
const alarmStatus = document.getElementById('alarmStatus');
const lastUpdate = document.getElementById('lastUpdate');
const thresholdData = document.getElementById('thresholdData');
const thresholdValue = document.getElementById('thresholdValue');

// Alarm kartı
const alarmCard = document.getElementById('alarmCard');
const alarmMessage = document.getElementById('alarmMessage');

// TAHMİN KARTI ELEMENTLERİ (YENİ!)
const usageRateElement = document.getElementById('usageRate');
const emptyPredictionElement = document.getElementById('emptyPrediction');
const timeToEmptyElement = document.getElementById('timeToEmpty');
const fullPredictionElement = document.getElementById('fullPrediction');
const timeToFullElement = document.getElementById('timeToFull');

// GRAFİK ELEMENTİ (YENİ!)
const levelChartCanvas = document.getElementById('levelChart');

// WebSocket URL göstergesi
const wsUrl = document.getElementById('wsUrl');

// ============================================================================
// GRAFİK KURULUMU (Chart.js)
// ============================================================================

/**
 * Chart.js ile çizgi grafiği oluştur
 * Son 24 saatin tank seviye değişimini gösterir
 */
let levelChart = null;

function initializeChart() {
  const ctx = levelChartCanvas.getContext('2d');

  levelChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [], // Zaman etiketleri
      datasets: [{
        label: 'Tank Seviyesi (%)',
        data: [], // Seviye verileri
        borderColor: '#3498db',
        backgroundColor: 'rgba(52, 152, 219, 0.1)',
        borderWidth: 2,
        tension: 0.4, // Yumuşak eğri
        fill: true,
        pointRadius: 0, // Noktaları gizle (daha temiz görünüm)
        pointHoverRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top'
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: function(context) {
              return `Seviye: ${context.parsed.y.toFixed(1)}%`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: 'Seviye (%)'
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Zaman'
          },
          grid: {
            display: false
          }
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    }
  });
}

// ============================================================================
// WEBSOCKET BAĞLANTISI
// ============================================================================

/**
 * WebSocket bağlantısını başlatır
 *
 * WEBSOCKET NEDİR?
 * - HTTP'nin aksine çift yönlü, sürekli bir bağlantıdır
 * - Server istediği zaman client'a veri gönderebilir
 * - Gerçek zamanlı uygulamalar için idealdir
 * - Örnek kullanım alanları: Chat, canlı izleme, multiplayer oyunlar
 */
function connectWebSocket() {
    console.log('[WebSocket] Bağlantı kuruluyor:', WS_URL);

    try {
        // WebSocket bağlantısı oluştur
        socket = new WebSocket(WS_URL);

        // Bağlantı başarıyla kurulduğunda
        socket.onopen = function(event) {
            console.log('[WebSocket] ✅ Bağlantı başarılı!');
            updateConnectionStatus(true);

            // Yeniden bağlanma timer'ını temizle
            if (reconnectTimer) {
                clearTimeout(reconnectTimer);
                reconnectTimer = null;
            }
        };

        // Backend'den mesaj geldiğinde
        socket.onmessage = function(event) {
            try {
                // Gelen JSON verisini parse et
                const data = JSON.parse(event.data);
                console.log('[WebSocket] 📩 Veri alındı:', data);

                // Mesaj tipine göre işlem yap
                handleIncomingData(data);
            } catch (error) {
                console.error('[WebSocket] Veri parse hatası:', error);
            }
        };

        // Bağlantı kapandığında
        socket.onclose = function(event) {
            console.log('[WebSocket] ❌ Bağlantı kesildi');
            updateConnectionStatus(false);

            // 3 saniye sonra yeniden bağlanmayı dene
            reconnectTimer = setTimeout(() => {
                console.log('[WebSocket] 🔄 Yeniden bağlanılıyor...');
                connectWebSocket();
            }, 3000);
        };

        // Hata oluştuğunda
        socket.onerror = function(error) {
            console.error('[WebSocket] Hata:', error);
            updateConnectionStatus(false);
        };

    } catch (error) {
        console.error('[WebSocket] Bağlantı hatası:', error);
        updateConnectionStatus(false);
    }
}

// ============================================================================
// VERİ İŞLEME
// ============================================================================

/**
 * Backend'den gelen veriyi işler ve arayüzü günceller
 *
 * @param {Object} data - Backend'den gelen veri objesi
 */
function handleIncomingData(data) {
    // Mesaj tipine göre işlem yap
    switch (data.type) {
        case 'connection':
            // İlk bağlantı mesajı
            console.log('[Sistem]', data.message);
            break;

        case 'tank_data':
            // Tank seviye verisi - Ana veri güncellemesi
            updateTankDisplay(data);
            break;

        default:
            console.log('[WebSocket] Bilinmeyen mesaj tipi:', data.type);
    }
}

/**
 * Tank görsel göstergesini günceller - GELİŞMİŞ VERSİYON
 *
 * Bu fonksiyon backend'den gelen seviye verisine göre:
 * - Tank doluluk oranını günceller
 * - Renkleri değiştirir (çoklu seviye desteği)
 * - Alarm durumunu kontrol eder
 * - Tüm veri alanlarını günceller
 * - TAHMİN verilerini gösterir (YENİ!)
 * - GRAFİK'i günceller (YENİ!)
 *
 * @param {Object} data - Tank verisi
 */
function updateTankDisplay(data) {
    const {
        level,
        isAlarmActive,
        alarmType,
        alarmLevels,
        threshold,
        message,
        timestamp,
        usageRate,
        prediction,
        history
    } = data;

    // Tank seviyesini yüzde olarak ayarla (CSS height property'si)
    tankLiquid.style.height = `${level}%`;
    tankPercentage.textContent = `${level.toFixed(1)}%`;

    // Veri alanlarını güncelle
    levelValue.textContent = `${level.toFixed(2)}%`;

    // Alarm durumu göstergesi (çoklu seviye)
    alarmStatus.textContent = getAlarmStatusText(alarmType, isAlarmActive);

    thresholdData.textContent = `${threshold}%`;
    thresholdValue.textContent = `${threshold}%`;

    // Son güncelleme zamanını formatla ve göster
    const updateTime = new Date(timestamp).toLocaleTimeString('tr-TR');
    lastUpdate.textContent = updateTime;

    // TAHMİN VERİLERİNİ GÜNCELLE (YENİ!)
    updatePredictionDisplay(usageRate, prediction);

    // GRAFİK'İ GÜNCELLE (YENİ!)
    if (history && history.length > 0) {
        updateChart(history);
    }

    // Alarm durumuna göre görsel güncellemeler
    if (isAlarmActive) {
        activateAlarm(message);
    } else {
        deactivateAlarm();
    }

    // Seviye ve alarm tipine göre sıvı rengini değiştir
    updateLiquidColor(level, alarmType, alarmLevels);
}

/**
 * Alarm durumu metnini döndür
 */
function getAlarmStatusText(alarmType, isAlarmActive) {
    if (alarmType === 'CRITICAL') return '🔴 KRİTİK';
    if (alarmType === 'HIGH') return '🟠 YÜKSEK';
    if (alarmType === 'WARNING') return '🟡 UYARI';
    if (alarmType === 'LOW') return '🔵 DÜŞÜK';
    return '🟢 Normal';
}

/**
 * TAHMİN VERİLERİNİ GÜNCELLE (YENİ!)
 *
 * Kullanım hızı ve tahmin verilerini ekranda gösterir
 */
function updatePredictionDisplay(usageRate, prediction) {
    // Kullanım hızını göster
    if (usageRate !== undefined && usageRate !== null) {
        const rateText = usageRate >= 0
            ? `+${usageRate.toFixed(2)} %/saat (dolma)`
            : `${usageRate.toFixed(2)} %/saat (boşalma)`;
        usageRateElement.textContent = rateText;
    }

    // Boşalma tahmini
    if (prediction && prediction.timeToEmpty) {
        emptyPredictionElement.style.display = 'flex';
        timeToEmptyElement.textContent = prediction.timeToEmpty;
        timeToEmptyElement.title = `Tahmini tarih: ${prediction.emptyDate}`;
    } else {
        emptyPredictionElement.style.display = 'none';
    }

    // Dolma tahmini
    if (prediction && prediction.timeToFull) {
        fullPredictionElement.style.display = 'flex';
        timeToFullElement.textContent = prediction.timeToFull;
        timeToFullElement.title = `Tahmini tarih: ${prediction.fullDate}`;
    } else {
        fullPredictionElement.style.display = 'none';
    }
}

/**
 * GRAFİK'İ GÜNCELLE (YENİ!)
 *
 * Geçmiş veri ile grafiği günceller
 */
function updateChart(history) {
    if (!levelChart) return;

    // Veriyi hazırla
    const labels = history.map(item => {
        const date = new Date(item.timestamp);
        return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    });

    const levels = history.map(item => item.level);

    // Grafiği güncelle
    levelChart.data.labels = labels;
    levelChart.data.datasets[0].data = levels;

    // Alarm durumlarına göre renkleri değiştir (opsiyonel)
    const colors = history.map(item => {
        if (item.alarmType === 'CRITICAL') return 'rgba(231, 76, 60, 0.1)';
        if (item.alarmType === 'HIGH') return 'rgba(243, 156, 18, 0.1)';
        if (item.alarmType === 'WARNING') return 'rgba(241, 196, 15, 0.1)';
        return 'rgba(52, 152, 219, 0.1)';
    });

    levelChart.update('none'); // Animasyonsuz güncelleme (performans için)
}

/**
 * Tank sıvısının rengini seviye ve alarm tipine göre ayarlar - ÇOKLU SEVİYE
 *
 * Renk Kodlaması:
 * - Kırmızı: CRITICAL (Kritik)
 * - Turuncu: HIGH (Yüksek)
 * - Sarı: WARNING (Uyarı)
 * - Mavi: Normal
 * - Yeşil: LOW (Düşük - dolum gerekli)
 */
function updateLiquidColor(level, alarmType, alarmLevels) {
    let color;

    // Alarm tipine göre renk seç
    switch (alarmType) {
        case 'CRITICAL':
            color = '#e74c3c'; // Kırmızı
            break;
        case 'HIGH':
            color = '#e67e22'; // Turuncu
            break;
        case 'WARNING':
            color = '#f1c40f'; // Sarı
            break;
        case 'LOW':
            color = '#27ae60'; // Yeşil
            break;
        default:
            color = '#3498db'; // Mavi (normal)
    }

    tankLiquid.style.background = color;
}

// ============================================================================
// ALARM SİSTEMİ
// ============================================================================

/**
 * Alarm durumunu aktive eder
 *
 * Görsel değişiklikler:
 * - Alarm kartını görünür yap
 * - Body'ye alarm class'ı ekle (tüm sayfa kırmızıya döner)
 * - Durum mesajını güncelle
 * - Durum badge'ini kırmızıya çevir
 *
 * @param {string} message - Alarm mesajı
 */
function activateAlarm(message) {
    // Alarm kartını göster
    alarmCard.classList.remove('hidden');
    alarmMessage.textContent = message;

    // Tüm sayfayı alarm moduna al
    document.body.classList.add('alarm-active');

    // Durum badge'ini güncelle
    statusBadge.style.background = '#e74c3c';
    statusMessage.textContent = 'ALARM AKTIF!';

    // Tarayıcı başlığını güncelle (görsel dikkat çekici)
    document.title = '🚨 ALARM - Margaz Kontrol';

    // Sesli alarm (opsiyonel - yorum satırından çıkarılabilir)
    // playAlarmSound();
}

/**
 * Alarm durumunu deaktive eder
 *
 * Tüm alarm görsel efektlerini kaldırır ve normal duruma döner
 */
function deactivateAlarm() {
    // Alarm kartını gizle
    alarmCard.classList.add('hidden');

    // Alarm modunu kaldır
    document.body.classList.remove('alarm-active');

    // Durum badge'ini normale döndür
    statusBadge.style.background = '#27ae60';
    statusMessage.textContent = 'Normal Çalışma';

    // Tarayıcı başlığını normale döndür
    document.title = 'Margaz Kontrol Sistemi - Tank İzleme';
}

/**
 * Sesli alarm çalma fonksiyonu (opsiyonel)
 *
 * Gerçek sistemde bu fonksiyon:
 * - Siren sesi çalabilir
 * - Tarayıcı notification gönderebilir
 * - SMS/Email tetikleyebilir
 */
function playAlarmSound() {
    // Web Audio API ile alarm sesi oluşturma
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800; // 800 Hz siren sesi
        oscillator.type = 'sine';
        gainNode.gain.value = 0.3; // Ses seviyesi

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.2); // 200ms süre
    } catch (error) {
        console.warn('Sesli alarm çalınamadı:', error);
    }
}

// ============================================================================
// BAĞLANTI DURUMU GÖSTERGESİ
// ============================================================================

/**
 * WebSocket bağlantı durumunu görsel olarak gösterir
 *
 * @param {boolean} connected - Bağlantı durumu (true: bağlı, false: bağlı değil)
 */
function updateConnectionStatus(connected) {
    if (connected) {
        // Bağlı durumu
        statusDot.classList.add('connected');
        statusDot.classList.remove('disconnected');
        statusText.textContent = '🟢 Sisteme bağlı - Veriler güncelleniyor';
        wsUrl.textContent = WS_URL;
    } else {
        // Bağlantı kesildi durumu
        statusDot.classList.remove('connected');
        statusDot.classList.add('disconnected');
        statusText.textContent = '🔴 Bağlantı kesildi - Yeniden bağlanılıyor...';
    }
}

// ============================================================================
// SAYFA YÜKLENDİĞİNDE ÇALIŞTIR
// ============================================================================

/**
 * Sayfa yüklendiğinde otomatik olarak çalışır
 *
 * DOMContentLoaded Eventi:
 * - Sayfa HTML'i tamamen yüklendikten sonra tetiklenir
 * - CSS ve görseller yüklenmeden önce çalışabilir
 * - JavaScript'in DOM elementlerine erişmesi için güvenli nokta
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🏭 MARGAZ KONTROL SİSTEMİ - FRONTEND BAŞLATILIYOR');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');

    // WebSocket URL'ini göster
    wsUrl.textContent = WS_URL;

    // GRAFİK'İ BAŞLAT (YENİ!)
    initializeChart();
    console.log('📊 Grafik sistemi hazır');

    // WebSocket bağlantısını başlat
    connectWebSocket();

    console.log('✅ Frontend başlatıldı');
    console.log('🔌 WebSocket bağlantısı kuruluyor:', WS_URL);
    console.log('');
    console.log('YENİ ÖZELLİKLER:');
    console.log('  ✅ Çoklu seviye alarmları (🔵 Düşük, 🟡 Uyarı, 🟠 Yüksek, 🔴 Kritik)');
    console.log('  ✅ Tahmin motoru (boşalma/dolma zamanı tahmini)');
    console.log('  ✅ Gerçek zamanlı grafik (son 24 saat)');
    console.log('');
    console.log('SUNUM NOTU: Bu sistem tamamen simülasyonludur.');
    console.log('Gerçek uygulamada sensör entegrasyonu yapılacaktır.');
    console.log('');
});

/**
 * Sayfa kapanmadan önce WebSocket bağlantısını temiz bir şekilde kapat
 */
window.addEventListener('beforeunload', function() {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
        console.log('[WebSocket] Bağlantı kapatıldı');
    }
});

// ============================================================================
// SUNUM İÇİN AÇIKLAMALAR
// ============================================================================

/**
 * 1. WEBSOCKET İLETİŞİMİ:
 *    - HTTP'den farkı: Sürekli, çift yönlü bağlantı
 *    - Server istediği zaman client'a veri gönderebilir
 *    - Gerçek zamanlı uygulamalar için ideal
 *    - Bağlantı kesilirse otomatik yeniden bağlanır
 *
 * 2. VERİ AKIŞI:
 *    Backend (Simülasyon) → WebSocket → Frontend (Görselleştirme)
 *    - Backend her 2 saniyede bir veri gönderir
 *    - Frontend veriyi alır ve tankı günceller
 *    - Sayfa yenilemeye gerek yok!
 *
 * 3. GÖRSEL GERİ BİLDİRİM:
 *    - Tank seviyesi dinamik olarak dolar/boşalır
 *    - Renk kodlaması ile durum belirtilir
 *    - Alarm durumunda tüm sayfa görünümü değişir
 *    - Animasyonlar ile profesyonel görünüm
 *
 * 4. HATA YÖNETİMİ:
 *    - Bağlantı kesilirse kullanıcı bilgilendirilir
 *    - Otomatik yeniden bağlanma mekanizması
 *    - Veri parse hataları yakalanır ve loglanır
 *    - Kullanıcı dostu hata mesajları
 *
 * 5. GENİŞLETİLEBİLİRLİK:
 *    - Sesli alarm eklenebilir (playAlarmSound fonksiyonu)
 *    - Browser notification eklenebilir
 *    - Grafik ve geçmiş veri görüntüleme eklenebilir
 *    - Çoklu tank desteği eklenebilir
 *    - Kullanıcı ayarları (eşik değeri değiştirme) eklenebilir
 *
 * 6. PERFORMANS:
 *    - DOM elementleri bir kere alınır, cache'lenir
 *    - Gereksiz DOM manipülasyonu yapılmaz
 *    - WebSocket ile minimum veri trafiği
 *    - CSS animasyonları GPU hızlandırmalı
 */
