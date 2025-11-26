#include <SoftwareSerial.h>
#include <ArduinoJson.h>

SoftwareSerial SerialGSM(7, 8); 
SoftwareSerial SerialNex(2, 3);

// YENİ ADRES BURADA:
const char* SERVER_HOST = "good-suns-fold.loca.lt"; 
const int SERVER_PORT = 80;
const char* API_PATH = "/api/v1/ingest";

const char* DEVICE_ID = "MOBIL_UNIT_UNO";
const char* TANK_ID = "91f2912b-391b-4fb1-a1f3-2963ceeb8182"; 

const char apn[]  = "internet";

const int POT_PIN = A0;
float currentLevel = 0.0;
unsigned long lastSendTime = 0;
const long SEND_INTERVAL = 5000; 

void setup() {
  Serial.begin(9600);
  SerialNex.begin(9600);
  SerialGSM.begin(9600);
  delay(1000);
  
  sendNextionCommand("tStatus.txt=\"Baslatiliyor...\"");
  
  sendATCommand("AT", 1000);
  sendATCommand("AT+CPIN?", 1000);
  sendATCommand("AT+CREG?", 1000);
  
  connectGPRS();
  pinMode(POT_PIN, INPUT);
}

void loop() {
  int rawValue = analogRead(POT_PIN);
  currentLevel = (rawValue / 1023.0) * 100.0;
  updateScreen(currentLevel);

  if (millis() - lastSendTime >= SEND_INTERVAL) {
    sendTelemetry(currentLevel);
    lastSendTime = millis();
  }
}

void sendNextionCommand(String cmd) {
  SerialNex.print(cmd);
  SerialNex.write(0xFF);
  SerialNex.write(0xFF);
  SerialNex.write(0xFF);
}

void updateScreen(float level) {
  int levelInt = (int)level;
  sendNextionCommand("nLevel.val=" + String(levelInt));
  sendNextionCommand("jLevel.val=" + String(levelInt));
  
  if (levelInt < 20) {
    sendNextionCommand("jLevel.pco=63488"); 
  } else {
    sendNextionCommand("jLevel.pco=2016");  
  }
}

void connectGPRS() {
  sendNextionCommand("tStatus.txt=\"GPRS...\"");
  sendATCommand("AT+SAPBR=3,1,\"Contype\",\"GPRS\"", 2000);
  sendATCommand("AT+SAPBR=3,1,\"APN\",\"internet\"", 2000);
  sendATCommand("AT+SAPBR=1,1", 5000);
  sendATCommand("AT+SAPBR=2,1", 2000);
  
  // HTTPS Başlat
  sendATCommand("AT+HTTPSSL=1", 2000);
  sendATCommand("AT+HTTPINIT", 2000);
  sendATCommand("AT+HTTPPARA=\"CID\",1", 2000);
  sendNextionCommand("tStatus.txt=\"Hazir\"");
}

void sendTelemetry(float level) {
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
  
  Serial.println(jsonString);
  sendNextionCommand("tStatus.txt=\"Gonderiliyor...\"");

  // URL Ayarla (HTTPS)
  String urlCmd = "AT+HTTPPARA=\"URL\",\"https://" + String(SERVER_HOST) + String(API_PATH) + "\"";
  sendATCommand(urlCmd, 2000);
  
  // Localtunnel Engelini Aşmak İçin User-Agent Değiştirme
  sendATCommand("AT+HTTPPARA=\"UA\",\"MargazIoT/1.0\"", 2000);
  
  sendATCommand("AT+HTTPPARA=\"CONTENT\",\"application/json\"", 2000);
  
  String dataCmd = "AT+HTTPDATA=" + String(jsonString.length()) + ",10000";
  sendATCommand(dataCmd, 2000);
  SerialGSM.print(jsonString);
  delay(500);
  
  SerialGSM.println("AT+HTTPACTION=1"); 
  delay(3000); 
  
  while(SerialGSM.available()) {
    Serial.write(SerialGSM.read());
  }
  
  sendNextionCommand("tStatus.txt=\"Gonderildi\"");
}

void sendATCommand(String cmd, int wait) {
  Serial.print("KOMUT: "); // Ekrana ne gönderdiğimizi yazalım
  Serial.println(cmd);
  
  SerialGSM.println(cmd);
  delay(wait);
  
  Serial.print("CEVAP: "); // Modülden gelen cevabı yazalım
  while(SerialGSM.available()) {
    Serial.write(SerialGSM.read());
  }
  Serial.println(); // Alt satıra geç
}