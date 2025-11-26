#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <EasyNextionLibrary.h>

// --- GSM MODÜL AYARLARI (SIM800L) ---
#define TINY_GSM_MODEM_SIM800
#include <TinyGSM.h>

// GSM Pinleri (ESP32'ye baglanti)
#define GSM_RX 4  // SIM800L TX -> ESP32 GPIO 4
#define GSM_TX 2  // SIM800L RX -> ESP32 GPIO 2

// Seri Haberleşme (GSM için)
HardwareSerial SerialGSM(1);

// GSM Nesnesi
TinyGsm modem(SerialGSM);
TinyGsmClient client(modem);

// GPRS Ayarlari (Turkcell/Vodafone/TurkTelekom icin genelde "internet" calisir)
const char apn[]  = "internet";
const char gprsUser[] = "";
const char gprsPass[] = "";

// --- NEXTION EKRAN AYARLARI ---
// Nextion TX -> ESP32 GPIO 16
// Nextion RX -> ESP32 GPIO 17
EasyNex myNex(Serial2); 

// --- KONFIGURASYON ---
const char* WIFI_SSID = "Margaz_WiFi"; 
const char* WIFI_PASS = "12345678";    

// Backend Adresi (IP adresini guncellemeyi unutma!)
const char* SERVER_HOST = "192.168.1.35"; // http:// olmadan sadece IP
const int SERVER_PORT = 3000;
const char* API_PATH = "/api/v1/ingest";

const char* DEVICE_ID = "MOBIL_UNIT_001";
const char* TANK_ID = "91f2912b-391b-4fb1-a1f3-2963ceeb8182"; 

// Pin Tanimlari
const int POT_PIN = 34; // Potansiyometre

// Degiskenler
float currentLevel = 0.0;
unsigned long lastSendTime = 0;
const long SEND_INTERVAL = 3000; 
bool useGSM = false; // Baslangicta Wi-Fi dene

void setup() {
  Serial.begin(115200);
  
  // 1. Nextion Baslat
  myNex.begin(9600);
  myNex.writeStr("tStatus.txt", "Sistem Baslatiliyor...");
  
  // 2. Wi-Fi Baglantisi
  connectWiFi();

  // 3. GSM Baslat (Yedek olarak hazirla)
  SerialGSM.begin(9600, SERIAL_8N1, GSM_RX, GSM_TX);
  delay(3000);
  
  // GSM Modulunu kontrol et
  Serial.println("GSM Modul Kontrol Ediliyor...");
  if (modem.restart()) {
     Serial.println("GSM Modul Bulundu!");
  } else {
     Serial.println("GSM Modul Bulunamadi (Baglanti veya Guc Hatasi)");
  }

  pinMode(POT_PIN, INPUT);
}

void loop() {
  // Nextion dinle (Dokunmatik olaylari icin)
  myNex.NextionListen();

  // 1. Sensor Okuma
  int rawValue = analogRead(POT_PIN);
  currentLevel = (rawValue / 4095.0) * 100.0;

  // Ekrani Guncelle
  updateScreen(currentLevel);

  // 2. Veri Gonderimi
  if (millis() - lastSendTime >= SEND_INTERVAL) {
    sendTelemetry(currentLevel);
    lastSendTime = millis();
  }
  
  delay(100);
}

void connectWiFi() {
  Serial.println("Wi-Fi Baglaniyor...");
  myNex.writeStr("tStatus.txt", "Wi-Fi Baglaniyor...");
  
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  
  int tryCount = 0;
  while (WiFi.status() != WL_CONNECTED && tryCount < 10) {
    delay(500);
    Serial.print(".");
    tryCount++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWi-Fi Baglandi!");
    myNex.writeStr("tStatus.txt", "Wi-Fi Bagli");
    myNex.writeNum("nWifi.val", 1); // Wi-Fi ikonunu yak
    useGSM = false;
  } else {
    Serial.println("\nWi-Fi Baglanamadi. GSM Moduna Geciliyor...");
    myNex.writeStr("tStatus.txt", "GSM Moduna Geciliyor...");
    useGSM = true;
    connectGSM();
  }
}

void connectGSM() {
  if (!modem.waitForNetwork()) {
    Serial.println("GSM Agi Bulunamadi");
    myNex.writeStr("tStatus.txt", "GSM Agi Yok");
    return;
  }
  
  if (modem.isNetworkConnected()) {
    Serial.println("GSM Agina Bagli");
    
    if (!modem.gprsConnect(apn, gprsUser, gprsPass)) {
      Serial.println("GPRS Baglantisi Basarisiz");
      myNex.writeStr("tStatus.txt", "GPRS Hatasi");
    } else {
      Serial.println("GPRS Baglandi!");
      myNex.writeStr("tStatus.txt", "4G Bagli");
      myNex.writeNum("nWifi.val", 0); // Wi-Fi ikonunu sondur
    }
  }
}

void sendTelemetry(float level) {
  // JSON Hazirla
  StaticJsonDocument<200> doc;
  doc["gateway_id"] = DEVICE_ID;
  JsonArray data = doc.createNestedArray("data");
  JsonObject item = data.createNestedObject();
  item["tank_id"] = TANK_ID;
  item["level"] = level;
  item["temperature"] = 24.5;
  item["pressure"] = 1.2;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  Serial.print("Gonderiliyor (" + String(useGSM ? "GSM" : "WiFi") + "): ");
  Serial.println(jsonString);

  if (!useGSM) {
    // Wi-Fi Uzerinden Gonder
    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      String url = String("http://") + SERVER_HOST + ":" + SERVER_PORT + API_PATH;
      http.begin(url);
      http.addHeader("Content-Type", "application/json");
      int httpCode = http.POST(jsonString);
      if (httpCode > 0) {
        Serial.println("Sunucu Cevabi: " + String(httpCode));
        myNex.writeStr("tStatus.txt", "Veri Gonderildi");
      } else {
        Serial.println("Hata: " + http.errorToString(httpCode));
        myNex.writeStr("tStatus.txt", "Sunucu Hatasi");
      }
      http.end();
    } else {
      connectWiFi(); // Tekrar baglanmayi dene
    }
  } else {
    // GSM Uzerinden Gonder
    if (modem.isGprsConnected()) {
      TinyGsmClient client(modem);
      HttpClient http(client, SERVER_HOST, SERVER_PORT);
      
      http.beginRequest();
      http.post(API_PATH);
      http.sendHeader("Content-Type", "application/json");
      http.sendHeader("Content-Length", jsonString.length());
      http.beginBody();
      http.print(jsonString);
      http.endRequest();

      int statusCode = http.responseStatusCode();
      Serial.println("GSM Sunucu Cevabi: " + String(statusCode));
      
      if (statusCode > 0) {
        myNex.writeStr("tStatus.txt", "Veri Gonderildi (GSM)");
      } else {
        myNex.writeStr("tStatus.txt", "GSM Sunucu Hatasi");
      }
      http.stop();
    } else {
      connectGSM(); // Tekrar baglanmayi dene
    }
  }
}

void updateScreen(float level) {
  // Nextion'daki "nLevel" (Number) ve "jLevel" (ProgressBar) bilesenlerini guncelle
  // Degeri int'e cevirip gonderiyoruz
  int levelInt = (int)level;
  
  myNex.writeNum("nLevel.val", levelInt);
  myNex.writeNum("jLevel.val", levelInt);
  
  // Renk degisimi (Ornek: %20 alti kirmizi)
  if (levelInt < 20) {
    myNex.writeNum("jLevel.pco", 63488); // Kirmizi
  } else {
    myNex.writeNum("jLevel.pco", 2016);  // Yesil
  }
}
