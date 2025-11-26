# MARGAZ IoT - Proje Durumu

**Tarih:** 26 Kasım 2025  
**Konum:** Desktop PC -> Laptop'a geçiş yapılıyor

## Neredeyiz?

**Donanım Prototipi** aşamasındayız. Arduino Uno ile masaüstü test cihazı yapıyoruz.

### ✅ Tamamlananlar
1. **Frontend & Backend:** Çalışıyor (Dashboard, API, Veritabanı OK)
2. **Arduino Firmware:** Yazıldı (`firmware/margaz-uno/margaz-uno.ino`)
3. **Potansiyometre Bağlantısı:** Arduino A0 pinine bağlandı, değerler okunuyor
4. **Kod Testi:** Arduino seri porttan veri gönderiyor

### ⚠️ MEVCUT SORUN
**Arduino -> Dashboard veri aktarımı çalışmıyor.**

**Sebep:** SIM800L (GSM Modülü) henüz **bağlanmadı**. Arduino internete çıkamıyor.

**Çözüm:** 
- SIM800L modülünü Arduino'ya bağlamak gerekiyor
- Güç kaynağı (LM2596 ile 4.0-4.2V) hazırlanmalı
- Bağlantı şeması: `firmware/hardware_assembly_guide.md`

## Kullanılan Bileşenler
- **Arduino Uno R3** (USB ile besleniyor)
- **Potansiyometre (10K):** GND, 5V, A0
- **SIM800L (henüz bağlı değil)**
- **Nextion Ekran (henüz bağlı değil)**

## Backend & Frontend Çalıştırma

### Backend:
```bash
cd backend
npx ts-node src/server.ts
```
Port: 3000

### Frontend:
```bash
cd frontend
npm run dev
```
Port: 5173

### Localtunnel (Arduino internete çıkması için):
```bash
npx localtunnel --port 3000
```

## Arduino Kodu Yükleme
1. Arduino IDE aç
2. `firmware/margaz-uno/margaz-uno.ino` dosyasını aç
3. Board: Arduino Uno seç
4. Port: COM7 (veya aktif port) seç
5. Yükle butonuna bas

## Sıradaki Adımlar
1. **SIM800L Bağlantısı:** Güç kaynağı + Arduino bağlantıları yap
2. **Test:** Arduino -> Localtunnel -> Backend -> Dashboard veri akışını doğrula
3. **Nextion Ekran:** UI tasarla ve yükle

## Önemli Dosyalar
- `firmware/margaz-uno/margaz-uno.ino` - Ana Arduino kodu
- `firmware/hardware_assembly_guide.md` - Donanım bağlantı kılavuzu
- `backend/prisma/schema.prisma` - Veritabanı şeması
- `frontend/src/components/Dashboard.tsx` - Ana dashboard bileşeni

## Tank ID (Test için)
```
91f2912b-391b-4fb1-a1f3-2963ceeb8182
```
Bu ID ile veri gönderiliyor ve dashboard'da "06 XYZ 456" plakası ile görünüyor.
