#include <WiFi.h>
#include <HTTPClient.h>

const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* BACKEND_URL = "http://YOUR_BACKEND_HOST:8080/api/telemetry";
const char* METER_ID = "esp32-meter-1";

const float ALERT_THRESHOLD_W = 2000.0;
unsigned long lastSendMs = 0;
const unsigned long SEND_INTERVAL_MS = 10000;
float totalEnergyKWh = 0.0;

struct Reading {
  float voltage;
  float current;
  float power;
};

Reading readEnergySensor() {
  // Replace with real sensor reads (e.g. PZEM-004T or SCT-013 + ADC circuit).
  Reading reading;
  reading.voltage = 220.0 + random(-50, 51) / 10.0;
  reading.current = 1.0 + random(0, 200) / 100.0;
  reading.power = reading.voltage * reading.current;
  return reading;
}

String toTelemetryJson(const Reading& reading, float energyKWh) {
  String payload = "{";
  payload += "\"meterId\":\"" + String(METER_ID) + "\",";
  payload += "\"voltage\":" + String(reading.voltage, 2) + ",";
  payload += "\"current\":" + String(reading.current, 2) + ",";
  payload += "\"power\":" + String(reading.power, 2) + ",";
  payload += "\"energyKWh\":" + String(energyKWh, 4);
  payload += "}";
  return payload;
}

void connectWiFi() {
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(" connected");
}

void sendTelemetry(const String& payload) {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  HTTPClient http;
  http.begin(BACKEND_URL);
  http.addHeader("Content-Type", "application/json");

  int responseCode = http.POST(payload);
  Serial.printf("POST %s => %d\n", BACKEND_URL, responseCode);
  if (responseCode > 0) {
    Serial.println(http.getString());
  }
  http.end();
}

void setup() {
  Serial.begin(115200);
  randomSeed(micros());
  connectWiFi();
}

void loop() {
  unsigned long now = millis();
  if (now - lastSendMs < SEND_INTERVAL_MS) {
    return;
  }

  float hours = SEND_INTERVAL_MS / 3600000.0;
  Reading reading = readEnergySensor();
  totalEnergyKWh += (reading.power / 1000.0) * hours;

  if (reading.power > ALERT_THRESHOLD_W) {
    Serial.printf("ALERT: high power usage %.2fW\n", reading.power);
  }

  String payload = toTelemetryJson(reading, totalEnergyKWh);
  sendTelemetry(payload);
  lastSendMs = now;
}
