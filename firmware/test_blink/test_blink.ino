void setup() {
  // Dahili LED'i çıkış olarak ayarla (Genelde Pin 13)
  pinMode(LED_BUILTIN, OUTPUT);
  
  // Seri haberleşmeyi başlat (USB üzerinden bilgisayara yazı göndermek için)
  Serial.begin(9600);
  Serial.println("-----------------------------------");
  Serial.println("Arduino Uno SAGLAM! Test Basarili.");
  Serial.println("-----------------------------------");
}

void loop() {
  // LED'i Yak
  digitalWrite(LED_BUILTIN, HIGH);
  Serial.println("LED Yandi (ON)");
  delay(1000); // 1 saniye bekle

  // LED'i Söndür
  digitalWrite(LED_BUILTIN, LOW);
  Serial.println("LED Sondu (OFF)");
  delay(1000); // 1 saniye bekle
}
