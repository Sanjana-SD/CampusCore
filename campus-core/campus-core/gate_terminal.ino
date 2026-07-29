// CampusCore Gateway Terminal Node - ESP8266 + RC522 RFID
// Reads card UID, fetches NTP time, POSTs to Express Backend, drives Buzzer & LCD

#include <SPI.h>
#include <MFRC522.h>
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <ArduinoJson.h> // Make sure to install the ArduinoJson library
#include <LiquidCrystal_I2C.h>
#include <time.h>

#define RST_PIN  D3
#define SS_PIN   D4
#define BUZZER   D8

#define WIFI_SSID     "iPhone 13"
#define WIFI_PASSWORD "Taha7860"

// Express Backend Configuration
// CHANGE THIS to your backend server IP address
const String server_url = "http://192.168.1.100:5000/api/attendance/scan"; 
const String device_id = "GATE_READER_01";

#define NTP_SERVER      "pool.ntp.org"
#define GMT_OFFSET      19800 // GMT+5:30 offset in seconds
#define DAYLIGHT_OFFSET 0

MFRC522 mfrc522(SS_PIN, RST_PIN);
LiquidCrystal_I2C lcd(0x27, 16, 2);

// Debounce state parameters
String lastScannedUID = "";
unsigned long lastScanMillis = 0;
const unsigned long debounceLimit = 3000; // 3 seconds local debounce safety check

void setup() {
  Serial.begin(9600);
  pinMode(BUZZER, OUTPUT);
  digitalWrite(BUZZER, LOW);

  // Initialize LCD display
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Connecting WiFi");

  // Establish Wifi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(300);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected!");
  lcd.clear();
  lcd.print("WiFi Connected!");
  delay(1000);

  // Configure NTP time synchronization
  configTime(GMT_OFFSET, DAYLIGHT_OFFSET, NTP_SERVER);
  lcd.clear();
  lcd.print("Syncing Time...");
  
  // Wait for time sync
  time_t now = time(nullptr);
  while (now < 8 * 3600 * 2) {
    delay(500);
    now = time(nullptr);
  }
  Serial.println("Time synchronized successfully.");

  // Initialize RFID hardware
  SPI.begin();
  mfrc522.PCD_Init();

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("CampusCore Node");
  lcd.setCursor(0, 1);
  lcd.print("SYSTEM READY");
  delay(1500);
}

void loop() {
  lcd.setCursor(0, 0);
  lcd.print("Scan RFID Card  ");
  lcd.setCursor(0, 1);
  lcd.print("                ");

  // Look for new card
  if (!mfrc522.PICC_IsNewCardPresent()) return;
  if (!mfrc522.PICC_ReadCardSerial()) return;

  // Convert UID array to HEX String (e.g. 83A2C51B)
  String rfid_uid = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    if (mfrc522.uid.uidByte[i] < 0x10) rfid_uid += "0";
    rfid_uid += String(mfrc522.uid.uidByte[i], HEX);
  }
  rfid_uid.toUpperCase();

  // Local Debounce check
  unsigned long now_ms = millis();
  if (rfid_uid == lastScannedUID && (now_ms - lastScanMillis) < debounceLimit) {
    mfrc522.PICC_HaltA();
    return;
  }
  lastScannedUID = rfid_uid;
  lastScanMillis = now_ms;

  Serial.println("\n--- CARD SCANNED ---");
  Serial.println("UID: " + rfid_uid);

  lcd.clear();
  lcd.print("Verifying...");

  // Fetch current ISO8601 timestamp from local system clock
  time_t now = time(nullptr);
  struct tm timeinfo;
  gmtime_r(&now, &timeinfo);
  char isoTimestamp[30];
  strftime(isoTimestamp, sizeof(isoTimestamp), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);

  // Send request payload to backend
  sendScanToBackend(rfid_uid, String(isoTimestamp));

  mfrc522.PICC_HaltA();
  delay(1500);
}

void sendScanToBackend(String rfid_uid, String isoTimestamp) {
  if (WiFi.status() != WL_CONNECTED) {
    lcd.clear();
    lcd.print("WiFi Connection");
    lcd.setCursor(0, 1);
    lcd.print("Offline. Failed.");
    triggerBuzzerFeedback("ERROR");
    return;
  }

  WiFiClient client;
  HTTPClient http;

  if (http.begin(client, server_url)) {
    http.addHeader("Content-Type", "application/json");

    // Serialize JSON request payload
    StaticJsonDocument<200> reqDoc;
    reqDoc["rfid_uid"] = rfid_uid;
    reqDoc["timestamp"] = isoTimestamp;
    reqDoc["device_id"] = device_id;

    String jsonPayload;
    serializeJson(reqDoc, jsonPayload);

    int httpCode = http.POST(jsonPayload);
    Serial.println("HTTP POST Response Code: " + String(httpCode));

    if (httpCode == 200) {
      String responseBody = http.getString();
      Serial.println("Response: " + responseBody);

      // Parse JSON response payload
      StaticJsonDocument<300> resDoc;
      DeserializationError err = deserializeJson(resDoc, responseBody);

      if (!err) {
        String result = resDoc["result"];
        const char* name = resDoc["student_name"];
        String studentName = name ? String(name) : "";
        String msg = resDoc["message"];

        lcd.clear();

        if (result == "IN") {
          lcd.print("Access Allowed");
          lcd.setCursor(0, 1);
          lcd.print(studentName.substring(0, 16));
          triggerBuzzerFeedback("IN");
        } 
        else if (result == "OUT") {
          lcd.print("Goodbye / OUT");
          lcd.setCursor(0, 1);
          lcd.print(studentName.substring(0, 16));
          triggerBuzzerFeedback("OUT");
        } 
        else if (result == "DUPLICATE") {
          lcd.print("Duplicate Scan");
          lcd.setCursor(0, 1);
          lcd.print("Please wait...");
          triggerBuzzerFeedback("DUPLICATE");
        } 
        else { // UNRECOGNIZED
          lcd.print("Card Invalid!");
          lcd.setCursor(0, 1);
          lcd.print("Access Denied");
          triggerBuzzerFeedback("UNRECOGNIZED");
        }
      } else {
        lcd.clear();
        lcd.print("Response Error");
        triggerBuzzerFeedback("ERROR");
      }
    } else {
      lcd.clear();
      lcd.print("Server Timeout");
      lcd.setCursor(0, 1);
      lcd.print("Code: " + String(httpCode));
      triggerBuzzerFeedback("ERROR");
    }
    http.end();
  }
}

// Buzzer feedback alerts (drives the edge buzzer pin D8)
void triggerBuzzerFeedback(String result) {
  if (result == "IN") {
    // 1 short beep
    digitalWrite(BUZZER, HIGH);
    delay(150);
    digitalWrite(BUZZER, LOW);
  } 
  else if (result == "OUT") {
    // 2 short beeps
    digitalWrite(BUZZER, HIGH);
    delay(100);
    digitalWrite(BUZZER, LOW);
    delay(100);
    digitalWrite(BUZZER, HIGH);
    delay(100);
    digitalWrite(BUZZER, LOW);
  } 
  else if (result == "UNRECOGNIZED" || result == "ERROR") {
    // 1 long beep
    digitalWrite(BUZZER, HIGH);
    delay(1500);
    digitalWrite(BUZZER, LOW);
  } 
  else if (result == "DUPLICATE") {
    // Quiet brief beep or no action
    digitalWrite(BUZZER, HIGH);
    delay(40);
    digitalWrite(BUZZER, LOW);
  }
}
