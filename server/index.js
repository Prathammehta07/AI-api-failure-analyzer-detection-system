import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

import store from './data/store.js';
import anomalyDetector from './services/anomalyDetector.js';
import { generateBatch, simulateFailure } from './services/logGenerator.js';

import logsRouter from './routes/logs.js';
import alertsRouter from './routes/alerts.js';
import analysisRouter from './routes/analysis.js';
import trendsRouter from './routes/trends.js';
import metricsRouter from './routes/metrics.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Serve static frontend files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
}
const wss = new WebSocketServer({ server, path: '/ws' });

// Store WSS globally for broadcasting
global.wss = wss;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/logs', logsRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/analysis', analysisRouter);
app.use('/api/trends', trendsRouter);
app.use('/api/metrics', metricsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Seed initial data
function seedData() {
  console.log('[Seed] Generating initial synthetic data...');
  
  const normalLogs = generateBatch(500);
  store.logs.push(...normalLogs);
  
  const failureLogs = simulateFailure('user-api', 8);
  failureLogs.forEach(l => {
    l.timestamp = new Date(Date.now() - 5 * 60 * 1000 + Math.random() * 30000).toISOString();
  });
  store.logs.push(...failureLogs);
  
  const searchFailures = simulateFailure('search-api', 4);
  searchFailures.forEach(l => {
    l.timestamp = new Date(Date.now() - 15 * 60 * 1000 + Math.random() * 60000).toISOString();
  });
  store.logs.push(...searchFailures);
  
  store.logs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  store.metrics.totalRequests = store.logs.length;
  
  console.log(`[Seed] Generated ${store.logs.length} initial logs`);
}

// WebSocket handling
wss.on('connection', (ws) => {
  console.log('[WebSocket] Client connected');
  
  ws.send(JSON.stringify({
    type: 'connection:established',
    data: { message: 'Connected to API Failure Detection System' },
  }));
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'subscribe:metrics') ws.subscribedMetrics = true;
      if (data.type === 'ping') ws.send(JSON.stringify({ type: 'pong' }));
    } catch (err) {
      console.error('[WebSocket] Invalid message:', err.message);
    }
  });
  
  ws.on('close', () => console.log('[WebSocket] Client disconnected'));
  ws.on('error', (err) => console.error('[WebSocket] Error:', err.message));
});

// Periodic metrics broadcast
function broadcastMetrics() {
  const metrics = {
    totalRequests: store.logs.length,
    activeAlerts: store.alerts.filter(a => !a.resolved).length,
    lastLogTimestamp: store.logs.length > 0 ? store.logs[store.logs.length - 1].timestamp : null,
  };
  
  wss.clients.forEach(client => {
    if (client.readyState === 1 && client.subscribedMetrics) {
      client.send(JSON.stringify({
        type: 'metric:update',
        data: metrics,
        timestamp: new Date().toISOString(),
      }));
    }
  });
}

// Generate continuous synthetic traffic
function generateContinuousTraffic() {
  const count = randomInt(3, 8);
  const logs = generateBatch(count);
  store.logs.push(...logs);
  store.metrics.totalRequests += count;
  
  if (Math.random() < 0.05) {
    const services = ['user-api', 'payment-api', 'order-api', 'inventory-api'];
    const service = services[Math.floor(Math.random() * services.length)];
    const failureLogs = simulateFailure(service, randomInt(2, 5));
    store.logs.push(...failureLogs);
    store.metrics.totalRequests += failureLogs.length;
    console.log(`[Traffic] Injected ${failureLogs.length} failure logs for ${service}`);
  }
  
  const maxLogs = 10000;
  if (store.logs.length > maxLogs) store.logs = store.logs.slice(-maxLogs);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}



// Error handling
app.use((err, req, res, next) => {
  console.error('[Error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 5010;

server.listen(PORT, () => {
  console.log(`
+============================================================+
|     API Failure Detection & Root Cause Analyzer v1.0.0     |
|                                                            |
|  Backend:   http://localhost:${PORT}                        |
|  WebSocket: ws://localhost:${PORT}/ws                       |
|                                                            |
+============================================================+
  `);
  
  seedData();
  anomalyDetector.start();
  setInterval(generateContinuousTraffic, 3000);
  setInterval(broadcastMetrics, 2000);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Shutdown] SIGTERM received, closing server...');
  anomalyDetector.stop();
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('[Shutdown] SIGINT received, closing server...');
  anomalyDetector.stop();
  server.close(() => process.exit(0));
});
