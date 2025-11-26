# Margaz Mobil Ünite - ESP32 Yazılımı

Bu klasör, Margaz Mobil Ünite (Prototip) için gerekli olan ESP32 yazılımını içerir.

## 🛠️ Kurulum Adımları

### 1. Arduino IDE İndirme
Eğer bilgisayarınızda yoksa, [Arduino IDE](https://www.arduino.cc/en/software) yazılımını indirip kurun.

### 2. ESP32 Desteğini Ekleme
1.  Arduino IDE'yi açın.
2.  `Dosya` > `Tercihler` menüsüne gidin.
3.  "Ek Devre Kartları Yöneticisi URL'leri" kutusuna şu adresi yapıştırın:
    `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
4.  `Araçlar` > `Kart` > `Kart Yöneticisi` menüsüne gidin.
5.  Arama kutusuna `esp32` yazın ve "esp32 by Espressif Systems" paketini kurun.

### 3. Gerekli Kütüphaneleri Yükleme
Bu proje için şu kütüphanelere ihtiyacımız var:
1.  `Araçlar` > `Kütüphane Yönetimi` menüsüne gidin.
2.  Şu kütüphaneleri aratıp kurun:
    *   **ArduinoJson** (Benoit Blanchon tarafından)
    *   **TinyGSM** (Volodymyr Shymanskyy tarafından) -> *SIM800L Modülü için*
    *   **EasyNextionLibrary** (Seithan tarafından) -> *Nextion Ekran için*
    *   **ArduinoHttpClient** (Arduino tarafından) -> *GSM üzerinden HTTP isteği için*

### 4. Kodu Yükleme
1.  `margaz-esp32.ino` dosyasını çift tıklayarak açın.
2.  Kodun en üstündeki şu ayarları kendinize göre düzenleyin:
    ```cpp
    const char* WIFI_SSID = "Evinizin_WiFi_Adi";
    const char* WIFI_PASS = "WiFi_Sifresi";
    const char* SERVER_URL = "http://BILGISAYAR_IP_ADRESI:3000/api/v1/ingest";
    ```
    *   **Önemli:** `SERVER_URL` kısmına `localhost` yazmayın! Bilgisayarınızın yerel IP adresini (örn: 192.168.1.35) yazmalısınız. IP adresinizi öğrenmek için terminale `ipconfig` yazabilirsiniz.
3.  ESP32 kartınızı USB ile bilgisayara bağlayın.
4.  `Araçlar` > `Kart` menüsünden `DOIT ESP32 DEVKIT V1` seçin.
5.  `Araçlar` > `Port` menüsünden bağlı olan portu seçin (COM3, COM4 vb.).
6.  Sol üstteki **Ok (Yükle)** butonuna basın.

## 🧪 Test Etme
Yükleme tamamlandıktan sonra:
1.  Sağ üstteki **Seri Port Ekranı** (Büyüteç ikonu) butonuna basın.
2.  Baud Rate ayarını **115200** yapın.
3.  Ekranda "Wi-Fi Baglandi!" ve "Gonderiliyor..." yazılarını görmelisiniz.
4.  Potansiyometreyi çevirdikçe Dashboard'da seviyenin değiştiğini göreceksiniz.
