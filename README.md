# smart-energy-meter-esp32

IoT-based smart energy meter using ESP32 with real-time monitoring, cloud dashboard, and energy analytics.

## Project structure

- `firmware/smart_energy_meter_esp32.ino` - ESP32 firmware that reads sensor values, calculates energy, and posts telemetry to cloud backend.
- `backend/server.js` - Node.js backend API to ingest telemetry, retain latest reading, and generate high-power alerts.
- `frontend/index.html` - Lightweight cloud dashboard for live telemetry and alert display.

## Backend quick start

```bash
cd backend
npm test
npm start
```

Server runs on `http://localhost:8080`.

## API endpoints

- `POST /api/telemetry` - Ingests ESP32 telemetry payload.
- `GET /api/telemetry/latest` - Returns latest meter reading.
- `GET /api/alerts` - Returns generated alert list.
- `GET /` - Serves dashboard.

## Firmware setup

1. Open `firmware/smart_energy_meter_esp32.ino` in Arduino IDE / PlatformIO.
2. Update `WIFI_SSID`, `WIFI_PASSWORD`, and `BACKEND_URL`.
3. Flash firmware to ESP32.

Replace the simulated sensor function with your actual energy sensor code.
