# Margaz Mobil Ünite - Arduino Uno Yazılımı

Bu klasör, **Arduino Uno** kullanan prototip için gerekli yazılımı içerir.

## ⚠️ Önemli Uyarılar
1.  **Wi-Fi Yok:** Arduino Uno'da Wi-Fi olmadığı için sadece SIM Kart (GPRS) ile çalışır. SIM kartınızın takılı, pin kodunun kaldırılmış ve internet paketinin olduğundan emin olun.
2.  **Güç:** SIM800L modülünü **ASLA** Arduino'nun 5V pininden beslemeyin. LM2596 ile harici 4V verin.

## 🛠️ Kurulum Adımları

### 1. Kütüphaneleri Yükleme
Arduino IDE'de `Araçlar` > `Kütüphane Yönetimi` menüsünden şunları kurun:
*   **ArduinoJson** (Benoit Blanchon)
*   *(EasyNextionLibrary'ye gerek kalmadı, kendi kodumuzla hallettik)*

### 2. Bağlantı Şeması (Pinler)
*   **SIM800L TX** -> Arduino **Pin 7**
*   **SIM800L RX** -> Arduino **Pin 8**
*   **Nextion TX** -> Arduino **Pin 2**
*   **Nextion RX** -> Arduino **Pin 3**
*   **Potansiyometre** -> Arduino **A0**

### 3. Kodu Yükleme
1.  `margaz-uno.ino` dosyasını açın.
2.  `SERVER_HOST` kısmına bilgisayarınızın IP adresini yazın.
3.  Arduino Uno'yu seçip yükleyin.

## 🧪 Test
Seri Port Ekranını (9600 Baud) açın. AT komutlarının aktığını ve "GPRS Hazir" yazdığını görmelisiniz.
