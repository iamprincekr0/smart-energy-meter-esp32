const test = require('node:test');
const assert = require('node:assert/strict');
const { createStore, processTelemetry } = require('../energyService');

test('processTelemetry stores latest values and no alert below threshold', () => {
  const store = createStore();
  const { telemetry, alert } = processTelemetry(
    store,
    {
      meterId: 'meter-01',
      voltage: 230,
      current: 2,
      power: 460,
      energyKWh: 1.25,
      timestamp: '2026-04-20T00:00:00.000Z'
    },
    1000
  );

  assert.equal(alert, null);
  assert.equal(telemetry.meterId, 'meter-01');
  assert.equal(store.latestTelemetry.power, 460);
  assert.equal(store.alerts.length, 0);
});

test('processTelemetry creates alert when power exceeds threshold', () => {
  const store = createStore();
  const { alert } = processTelemetry(
    store,
    {
      meterId: 'meter-01',
      voltage: 230,
      current: 10,
      power: 2300,
      energyKWh: 3.4,
      timestamp: '2026-04-20T00:00:10.000Z'
    },
    2000
  );

  assert.ok(alert);
  assert.equal(store.alerts.length, 1);
  assert.equal(store.alerts[0].powerW, 2300);
});

test('processTelemetry rejects invalid telemetry payload', () => {
  const store = createStore();

  assert.throws(
    () => processTelemetry(store, { voltage: 'x', current: 3, power: 100, energyKWh: 1 }),
    /Invalid voltage/
  );
});
