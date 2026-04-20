const MAX_ALERTS = 100;

function createStore() {
  return {
    latestTelemetry: null,
    alerts: []
  };
}

function toFiniteNumber(value, name) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    throw new Error(`Invalid ${name}`);
  }
  return numeric;
}

function processTelemetry(store, payload, thresholdW = 2000) {
  if (!store || typeof store !== 'object') {
    throw new Error('Store is required');
  }

  const meterId = String(payload?.meterId || 'esp32-meter-1');
  const telemetry = {
    meterId,
    timestamp: payload?.timestamp || new Date().toISOString(),
    voltage: toFiniteNumber(payload?.voltage, 'voltage'),
    current: toFiniteNumber(payload?.current, 'current'),
    power: toFiniteNumber(payload?.power, 'power'),
    energyKWh: toFiniteNumber(payload?.energyKWh, 'energyKWh')
  };

  store.latestTelemetry = telemetry;

  let alert = null;
  if (telemetry.power > thresholdW) {
    alert = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      meterId,
      timestamp: telemetry.timestamp,
      powerW: telemetry.power,
      thresholdW,
      message: `High power usage detected: ${telemetry.power.toFixed(2)}W`
    };
    store.alerts.unshift(alert);
    if (store.alerts.length > MAX_ALERTS) {
      store.alerts.length = MAX_ALERTS;
    }
  }

  return { telemetry, alert };
}

module.exports = {
  createStore,
  processTelemetry,
  MAX_ALERTS
};
