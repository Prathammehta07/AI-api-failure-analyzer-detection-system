import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import store from '../data/store.js';
import { generateBatch } from '../services/logGenerator.js';

const router = express.Router();

router.post('/', (req, res) => {
  const logs = Array.isArray(req.body) ? req.body : [req.body];
  
  const processed = logs.map(log => ({
    id: uuidv4(),
    timestamp: log.timestamp || new Date().toISOString(),
    service: log.service || 'unknown',
    endpoint: log.endpoint || '/',
    method: log.method || 'GET',
    statusCode: log.statusCode || 200,
    latency_ms: log.latency_ms || 0,
    error: log.error || null,
    error_type: log.error_type || null,
    request_id: log.request_id || `req_${Math.random().toString(36).slice(2, 10)}`,
  }));
  
  store.logs.unshift(...processed);
  
  const maxLogs = store.config.retentionHours * 1000;
  if (store.logs.length > maxLogs) store.logs = store.logs.slice(0, maxLogs);
  
  if (global.wss) {
    global.wss.clients.forEach(client => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({ type: 'log:ingested', count: processed.length }));
      }
    });
  }
  
  res.json({ success: true, count: processed.length, ids: processed.map(l => l.id) });
});

router.get('/', (req, res) => {
  let logs = [...store.logs];
  
  if (req.query.service) logs = logs.filter(l => l.service === req.query.service);
  if (req.query.endpoint) logs = logs.filter(l => l.endpoint.includes(req.query.endpoint));
  if (req.query.method) logs = logs.filter(l => l.method === req.query.method.toUpperCase());
  if (req.query.statusCode) {
    const code = parseInt(req.query.statusCode);
    if (req.query.statusCode.startsWith('4') || req.query.statusCode.startsWith('5')) {
      logs = logs.filter(l => l.statusCode >= code && l.statusCode < code + 100);
    } else {
      logs = logs.filter(l => l.statusCode === code);
    }
  }
  if (req.query.search) {
    const search = req.query.search.toLowerCase();
    logs = logs.filter(l =>
      l.service?.toLowerCase().includes(search) ||
      l.endpoint?.toLowerCase().includes(search) ||
      l.error?.toLowerCase().includes(search) ||
      l.error_type?.toLowerCase().includes(search) ||
      l.request_id?.toLowerCase().includes(search)
    );
  }
  if (req.query.error === 'true') logs = logs.filter(l => l.statusCode >= 400);
  
  logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const start = (page - 1) * limit;
  
  res.json({
    logs: logs.slice(start, start + limit),
    total: logs.length,
    page,
    limit,
    totalPages: Math.ceil(logs.length / limit),
  });
});

router.post('/generate', (req, res) => {
  const count = parseInt(req.query.count) || 10;
  const options = req.body || {};
  const logs = generateBatch(Math.min(count, 100), options);
  store.logs.unshift(...logs);
  store.metrics.totalRequests += logs.length;
  res.json({ success: true, count: logs.length, logs });
});

export default router;
