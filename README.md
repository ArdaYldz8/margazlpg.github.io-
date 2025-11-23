# 🏭 MARGAZ KONTROL SİSTEMİ

## Gaz Tankı Seviye İzleme ve Alarm Sistemi - Simülasyon Prototipi

Bu proje, gaz sektöründe kullanılmak üzere tasarlanmış bir tank seviye izleme ve alarm sisteminin yazılımsal simülasyonudur. Gerçek donanım olmadan, tamamen yazılımsal olarak bir gaz tankının seviye değişimini izler ve belirli eşik değerleri aştığında alarm verir.

---

## 📋 İçindekiler

- [Proje Hakkında](#proje-hakkında)
- [Özellikler](#özellikler)
- [Teknolojiler](#teknolojiler)
- [Kurulum](#kurulum)
- [Kullanım](#kullanım)
- [Proje Yapısı](#proje-yapısı)
- [Sunum Notları](#sunum-notları)
- [Nasıl Çalışır?](#nasıl-çalışır)
- [Gerçek Sisteme Geçiş](#gerçek-sisteme-geçiş)
- [Ekran Görüntüleri](#ekran-görüntüleri)
- [Sorun Giderme](#sorun-giderme)

---

## 🎯 Proje Hakkında

Bu sistem, bir gaz tankındaki sıvılaştırılmış gaz seviyesini **uzaktan izlemek** ve **otomatik alarm** vermek için tasarlanmış bir **prototip simülasyondur**.

### Amaç

- **Demo/Sunum:** Yazılım mantığını göstermek ve sistemi tanıtmak
- **Prototip:** Gerçek donanım öncesi yazılım testleri yapmak
- **Eğitim:** IoT, WebSocket ve gerçek zamanlı sistemleri anlamak

### Simülasyon vs Gerçek Sistem

| Özellik | Simülasyon | Gerçek Sistem |
|---------|-----------|---------------|
| Veri Kaynağı | Matematiksel simülasyon | Fiziksel sensör (Ultrasonik, Kapasitif, vs.) |
| Donanım | Yok | Arduino, Raspberry Pi, PLC, vs. |
| Haberleşme | WebSocket (Local) | WiFi, LoRa, GSM, 4G, vs. |
| Alarm | Ekranda görsel uyarı | SMS, Email, Siren, Işık, Valf kontrolü |

---

## ✨ Özellikler

### 🎨 Frontend (Kullanıcı Arayüzü)

- ✅ **Gerçek Zamanlı Tank Göstergesi:** Görsel olarak dolan/boşalan tank animasyonu
- ✅ **Dinamik Renk Kodlaması:** Yeşil (düşük), Mavi (normal), Turuncu (uyarı), Kırmızı (alarm)
- ✅ **Alarm Sistemi:** Eşik aşıldığında tüm ekran kırmızıya döner ve uyarı gösterir
- ✅ **Bağlantı Durumu:** WebSocket bağlantı durumu göstergesi
- ✅ **Responsive Tasarım:** PC, tablet ve mobil cihazlarda düzgün çalışır
- ✅ **Animasyonlu Göstergeler:** Dalga efekti, pulse animasyonları

### 🔧 Backend (Simülasyon Motoru)

- ✅ **Seviye Simülasyonu:** Gerçekçi tank dolum/boşalma simülasyonu
- ✅ **Otomatik Alarm:** %80 eşiğinde otomatik alarm tetikleme
- ✅ **WebSocket Server:** Gerçek zamanlı veri iletimi
- ✅ **REST API:** Alternatif veri erişim yöntemi
- ✅ **Konsol Loglama:** Detaylı sistem logları
- ✅ **Otomatik Yeniden Bağlanma:** Bağlantı kesilirse otomatik recovery

---

## 🛠️ Teknolojiler

### Backend

- **Node.js:** JavaScript runtime environment
- **TypeScript:** Type-safe JavaScript
- **Express:** Web server framework
- **WebSocket (ws):** Gerçek zamanlı iletişim
- **CORS:** Cross-origin resource sharing

### Frontend

- **HTML5:** Semantic markup
- **CSS3:** Modern styling, animations, flexbox, grid
- **JavaScript (ES6+):** WebSocket client, DOM manipulation
- **WebSocket API:** Gerçek zamanlı veri alma

---

## 📦 Kurulum

### Gereksinimler

- **Node.js** (v16 veya üzeri) - [İndirin](https://nodejs.org/)
- **npm** (Node.js ile birlikte gelir)
- Bir web tarayıcı (Chrome, Firefox, Edge, Safari)

### Adım 1: Projeyi İndirin veya Klonlayın

```bash
# Eğer Git kullanıyorsanız:
git clone <repository-url>
cd margaz-kontrol

# Veya ZIP olarak indirip extract edin
```

### Adım 2: Backend Bağımlılıklarını Yükleyin

```bash
cd backend
npm install
```

Bu komut aşağıdaki paketleri yükler:
- `express`: Web server
- `ws`: WebSocket server
- `cors`: CORS desteği
- `typescript`: TypeScript compiler
- Diğer TypeScript type tanımları

### Adım 3: Backend'i Derleyin (TypeScript → JavaScript)

```bash
npm run build
```

Bu komut TypeScript kodunu JavaScript'e derler ve `dist/` klasörüne kaydeder.

---

## 🚀 Kullanım

### Backend'i Başlatın

```bash
cd backend
npm start
```

veya geliştirme modunda (TypeScript direkt çalıştırma):

```bash
npm run dev
```

**Çıktı:**
```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║        🏭 MARGAZ KONTROL SİSTEMİ - SİMÜLASYON 🏭         ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

🌐 Backend Server: http://localhost:3000
🔌 WebSocket Server: ws://localhost:3000
🚨 Alarm Eşiği: %80
⏱️  Güncelleme Aralığı: 2000ms (2 saniye)

📊 Simülasyon başlatıldı...
💡 Frontend'i görmek için tarayıcınızda http://localhost:3000 adresine gidin
```

### Frontend'i Açın

Tarayıcınızda şu adresi açın:

```
http://localhost:3000
```

**Tebrikler!** 🎉 Sistem çalışıyor!

- Tank seviyesi otomatik olarak değişecek
- %80 seviyesini aşarsa alarm tetiklenecek
- Tüm veriler gerçek zamanlı güncellenecek

---

## 📁 Proje Yapısı

```
margaz-kontrol/
│
├── backend/                      # Backend (Simülasyon Motoru)
│   ├── src/
│   │   └── server.ts            # Ana server kodu (TypeScript)
│   ├── dist/                    # Derlenmiş JavaScript kodları
│   │   └── server.js            # Derlenmiş server kodu
│   ├── package.json             # Backend bağımlılıkları
│   └── tsconfig.json            # TypeScript yapılandırması
│
├── frontend/                     # Frontend (Kullanıcı Arayüzü)
│   ├── index.html               # Ana HTML sayfa
│   ├── style.css                # Stil dosyası (Tank tasarımı, animasyonlar)
│   └── script.js                # JavaScript (WebSocket client, DOM güncellemeleri)
│
└── README.md                     # Bu dosya
```

---

## 🎤 Sunum Notları

Yarınki sunumunuz için önemli noktalar:

### 1️⃣ Sistemi Tanıtırken

**"Bu sistem nedir?"**
- Gaz tankı seviye izleme ve alarm sistemi
- Gerçek donanım olmadan yazılımsal simülasyon
- Gerçek sisteme geçiş için hazırlık prototipi

### 2️⃣ Teknolojileri Açıklarken

**Backend:**
- Node.js ve TypeScript ile yazıldı
- WebSocket ile gerçek zamanlı veri iletimi
- Her 2 saniyede seviye güncellenir
- %80 eşiğinde otomatik alarm

**Frontend:**
- Modern HTML, CSS ve JavaScript
- Gerçek zamanlı tank göstergesi
- Renk kodlamalı durum gösterimi
- Responsive tasarım (her cihazda çalışır)

### 3️⃣ Demo Sırasında Gösterecekleriniz

1. **Sistem Başlatma:**
   ```bash
   cd backend
   npm start
   ```

2. **Tarayıcıda Açma:**
   - `http://localhost:3000` adresine gidin

3. **Canlı İzleme:**
   - Tank seviyesinin değişmesini gösterin
   - Bağlantı durumunu gösterin
   - Anlık verileri gösterin

4. **Alarm Sistemi:**
   - Seviye %80'i aşana kadar bekleyin
   - Alarm tetiklendiğinde ekranın kırmızıya dönmesini gösterin
   - Alarm mesajını gösterin

5. **Konsol Logları:**
   - Terminal'de backend loglarını gösterin
   - Seviye değişimlerini gösterin
   - Alarm mesajlarını gösterin

### 4️⃣ Sık Sorulan Sorular ve Cevapları

**S: Bu gerçek sensörle çalışıyor mu?**
- C: Hayır, şu an simülasyon modunda. Gerçek sistemde sensör bağlanacak.

**S: Hangi sensörler kullanılabilir?**
- C: Ultrasonik, kapasitif, basınç sensörleri veya float switch kullanılabilir.

**S: Uzaktan erişim var mı?**
- C: Şu an lokal ağda çalışıyor. Gerçek sistemde internet üzerinden erişim eklenebilir.

**S: SMS veya email uyarısı var mı?**
- C: Şu an yok ama kolayca eklenebilir. Backend'e SMS/email servisi entegre edilebilir.

**S: Birden fazla tank izlenebilir mi?**
- C: Evet, sistem ölçeklenebilir. Her tank için ayrı simülasyon instance'ı oluşturulabilir.

### 5️⃣ Gerçek Sisteme Geçiş Planı

**Dedenize anlatırken:**

"Şu an yazılımı test ediyoruz. Gerçek sisteme geçmek için:

1. **Donanım Seçimi:** Arduino veya Raspberry Pi
2. **Sensör Montajı:** Ultrasonik sensör tankın üstüne monte edilecek
3. **İnternet Bağlantısı:** WiFi veya GSM modül eklenecek
4. **Güç Kaynağı:** Solar panel veya adaptör ile sürekli güç
5. **Yazılım Adaptasyonu:** Simülasyon kodu yerine sensör okuma kodu yazılacak"

---

## ⚙️ Nasıl Çalışır?

### Veri Akışı

```
┌─────────────────┐
│   BACKEND       │
│  (Simülasyon)   │
│                 │
│  1. Seviye      │
│     Üretimi     │◄─── Matematiksel simülasyon (gerçek sistemde sensör)
│                 │
│  2. Eşik        │
│     Kontrolü    │◄─── %80 kontrolü
│                 │
│  3. Veri        │
│     Gönderme    │
└────────┬────────┘
         │ WebSocket
         │ (Gerçek zamanlı)
         │
         ▼
┌─────────────────┐
│   FRONTEND      │
│  (Arayüz)       │
│                 │
│  1. Veri Alma   │◄─── WebSocket ile sürekli bağlantı
│                 │
│  2. Tank        │
│     Güncelleme  │◄─── Doluluk oranı, renk değişimi
│                 │
│  3. Alarm       │
│     Gösterimi   │◄─── Kırmızı ekran, uyarı mesajı
└─────────────────┘
```

### Simülasyon Algoritması

Backend'de seviye şöyle simüle edilir:

```typescript
// Her 2 saniyede bir:
1. Rastgele bir değişim miktarı üret (-5 ile +5 arası)
2. Mevcut seviyeye ekle/çıkar
3. Seviyeyi 0-100 arasında sınırla
4. Eşik kontrolü yap (%80)
5. WebSocket ile frontend'e gönder
```

---

## 🔄 Gerçek Sisteme Geçiş

### Donanım Gereksinimleri

1. **Mikrokontrolör:**
   - Arduino (Uno, Nano, ESP32)
   - Raspberry Pi
   - PLC (Endüstriyel uygulamalar için)

2. **Sensör:**
   - Ultrasonik mesafe sensörü (HC-SR04)
   - Kapasitif seviye sensörü
   - Basınç sensörü
   - Float switch (mekanik)

3. **İletişim Modülü:**
   - ESP8266/ESP32 (WiFi)
   - GSM modül (SIM800L)
   - LoRa modül (uzun menzil)

4. **Güç Kaynağı:**
   - Solar panel + Batarya
   - AC/DC adaptör
   - Endüstriyel güç kaynağı

### Yazılım Değişiklikleri

**Backend'de değişecek kısım:**

```typescript
// ŞU AN (Simülasyon):
function simulateTankLevel(): void {
  const change = (Math.random() - 0.5) * 10;
  tankLevel += change;
  // ...
}

// GERÇEK SİSTEM:
async function readTankLevel(): Promise<number> {
  // Sensörden veri oku (I2C, SPI, UART, vs.)
  const sensorData = await readSensor();

  // Ham veriyi yüzdeye çevir
  const level = convertToPercentage(sensorData);

  return level;
}
```

**Frontend:** Değişiklik gerektirmez! Aynı WebSocket protokolünü kullanır.

### Eklenmesi Gereken Özellikler

1. **SMS/Email Alarm:**
   - Twilio, SendGrid gibi servisler
   - GSM modül ile direkt SMS

2. **Veritabanı:**
   - Geçmiş verileri saklamak (MongoDB, PostgreSQL)
   - Grafik ve analiz için

3. **Kullanıcı Yönetimi:**
   - Giriş/çıkış sistemi
   - Yetkilendirme
   - Çoklu kullanıcı desteği

4. **Raporlama:**
   - Günlük/haftalık/aylık raporlar
   - PDF/Excel export

5. **Bakım ve Konfigürasyon:**
   - Eşik değerini değiştirme
   - Sensör kalibrasyonu
   - Sistem ayarları

---

## 📸 Ekran Görüntüleri

### Normal Durum
- Tank seviyesi göstergesi (mavi)
- Yeşil durum badge'i
- Bağlantı durumu aktif

### Alarm Durumu
- Tank seviyesi kırmızı
- Tüm ekran kırmızı arka plan
- Alarm kartı görünür
- Uyarı mesajları aktif

*(Not: Gerçek ekran görüntüleri eklenebilir)*

---

## 🔧 Sorun Giderme

### Sorun: Backend başlamıyor

**Çözüm:**
```bash
# Port zaten kullanımda olabilir, başka port deneyin:
# server.ts dosyasında PORT değerini değiştirin (örn: 3001)

# Veya çalışan process'i bulup durdurun:
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID_NUMARASI> /F

# Linux/Mac:
lsof -i :3000
kill -9 <PID>
```

### Sorun: Frontend bağlanamıyor

**Çözüm:**
1. Backend'in çalıştığından emin olun
2. Tarayıcı konsolunu açın (F12) ve hataları kontrol edin
3. WebSocket URL'ini kontrol edin ([script.js:45](frontend/script.js#L45))

### Sorun: npm install hatası

**Çözüm:**
```bash
# npm cache temizle
npm cache clean --force

# Node.js versiyonunu kontrol et (v16+)
node --version

# npm güncellenemiyorsa Node.js'i yeniden yükleyin
```

### Sorun: TypeScript derleme hatası

**Çözüm:**
```bash
# TypeScript'i global yükleyin
npm install -g typescript

# Yeniden derleyin
npm run build
```

---

## 🎓 Öğrenme Kaynakları

Bu projeyi anlamak ve geliştirmek için:

### WebSocket
- [MDN WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [WebSocket Protocol RFC](https://datatracker.ietf.org/doc/html/rfc6455)

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TypeScript in 5 minutes](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html)

### Node.js & Express
- [Node.js Documentation](https://nodejs.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)

### IoT ve Sensörler
- [Arduino Tutorials](https://www.arduino.cc/en/Tutorial/HomePage)
- [Raspberry Pi Documentation](https://www.raspberrypi.org/documentation/)

---

## 📞 İletişim ve Destek

Sorularınız için:
- 📧 Email: [email adresiniz]
- 📱 Telefon: [telefon numaranız]
- 💬 GitHub Issues: [repository linki]

---

## 📝 Lisans

Bu proje eğitim ve demo amaçlı geliştirilmiştir.

---

## 🙏 Teşekkürler

Bu projeyi kullandığınız için teşekkür ederiz!

**Başarılı bir sunum dileriz!** 🚀🎉

---

**Son Güncelleme:** 2024
**Versiyon:** 1.0.0
**Durum:** Prototip / Demo Aşaması
