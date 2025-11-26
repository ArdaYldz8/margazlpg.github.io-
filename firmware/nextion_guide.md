# Nextion Ekran Tasarım Rehberi

Elinizdeki **Nextion NX3224T024_011** (2.4 inç) ekranı programlamak için bu rehberi izleyin.

## 1. Nextion Editor Kurulumu
1.  [Nextion Editor İndir](https://nextion.tech/editor/) adresinden programı indirip kurun.
2.  Programı açın.

## 2. Yeni Proje Oluşturma
1.  **File** > **New** diyerek yeni bir dosya oluşturun (Örn: `MargazMobil.HMI`).
2.  **Device** sekmesinde:
    *   Sol taraftan **T Serisi** (Basic Series) seçin.
    *   Listeden **NX3224T024_011** modelini seçin.
3.  **Display** sekmesinde:
    *   **Direction:** 90 (Yatay kullanım için) seçin.
4.  **OK** diyerek projeyi açın.

## 3. Arayüz Tasarımı (Bileşenleri Ekleme)
Ekranınıza şu bileşenleri ekleyin (Toolbox kutusundan sürükleyip bırakın):

### A. İlerleme Çubuğu (Seviye Göstergesi)
*   **Bileşen:** `ProgressBar` (j0)
*   **Objname:** `jLevel` (Bu ismi kodda kullanacağız, aynısı olmalı!)
*   **Ayarlar (Attribute):**
    *   `vvs1`: 100 (Maksimum değer)
    *   `pco`: 2016 (Yeşil renk)

### B. Sayı Kutusu (Yüzde Değeri)
*   **Bileşen:** `Number` (n0)
*   **Objname:** `nLevel`
*   **Ayarlar:**
    *   `font`: 0 (Bir font seçmelisiniz, Tools > Font Generator ile font oluşturup ekleyin)

### C. Durum Metni (Bilgi Ekranı)
*   **Bileşen:** `Text` (t0)
*   **Objname:** `tStatus`
*   **Ayarlar:**
    *   `txt`: "Sistem Hazir" (Başlangıç yazısı)
    *   `w`: Ekranı kaplayacak kadar genişletin.

### D. Wi-Fi İkonu (Opsiyonel)
*   **Bileşen:** `Number` veya `Picture`
*   **Objname:** `nWifi`
*   **Amaç:** 1 ise Wi-Fi var, 0 ise yok (GSM) gösterir.

## 4. Font Oluşturma (Önemli!)
Nextion ekranlar Windows fontlarını doğrudan kullanmaz.
1.  **Tools** > **Font Generator** menüsüne gidin.
2.  **Height:** 24 veya 32 seçin (Okunabilir büyüklükte).
3.  **Font:** Arial seçin.
4.  **Name:** `Arial24` gibi bir isim verin.
5.  **Generate Font** butonuna basın ve kaydedin.
6.  "Add the generated font?" sorusuna **Yes** deyin.

## 5. Yükleme (Compile & Upload)
1.  Sol üstteki **Compile** butonuna basın. (Hata varsa altta yazar).
2.  **Upload** butonuna basın.
3.  Nextion ekranınızı USB-TTL dönüştürücü ile bilgisayara bağlayın ve portu seçip yükleyin.
    *   *Alternatif:* **File** > **TFT File Output** diyerek `.tft` dosyasını bir microSD karta atın. Kartı ekrana takıp elektriği verin, otomatik yüklenir.
