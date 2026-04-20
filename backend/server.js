const http = require('http');
const fs = require('fs');
const path = require('path');
const { createStore, processTelemetry } = require('./energyService');

const PORT = Number(process.env.PORT || 8080);
const POWER_ALERT_THRESHOLD_W = Number(process.env.POWER_ALERT_THRESHOLD_W || 2000);
const MAX_PAYLOAD_SIZE = 1_000_000;
const store = createStore();
const frontendPath = path.resolve(__dirname, '..', 'frontend', 'index.html');

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > MAX_PAYLOAD_SIZE) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    sendJson(res, 200, { status: 'ok' });
    return;
  }

  if (req.method === 'GET' && req.url === '/api/telemetry/latest') {
    sendJson(res, 200, {
      telemetry: store.latestTelemetry,
      thresholdW: POWER_ALERT_THRESHOLD_W
    });
    return;
  }

  if (req.method === 'GET' && req.url === '/api/alerts') {
    sendJson(res, 200, { alerts: store.alerts });
    return;
  }

  if (req.method === 'POST' && req.url === '/api/telemetry') {
    try {
      const payload = await readJson(req);
      const result = processTelemetry(store, payload, POWER_ALERT_THRESHOLD_W);
      sendJson(res, 201, {
        message: 'Telemetry accepted',
        telemetry: result.telemetry,
        alert: result.alert
      });
    } catch (error) {
      sendJson(res, 400, { error: error.message });
    }
    return;
  }

  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    fs.readFile(frontendPath, 'utf-8', (error, html) => {
      if (error) {
        sendJson(res, 500, { error: 'Dashboard not available' });
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    });
    return;
  }

  sendJson(res, 404, { error: 'Not found' });
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Smart energy backend listening on http://localhost:${PORT}`);
  });
}

module.exports = { server };
