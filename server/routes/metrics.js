import express from 'express';
import store from '../data/store.js';

const router = express.Router();

router.get('/', (req, res) => {
  const now = Date.now();
  const fiveMinAgo = now - 5 * 60 * 1000;
  
  const recentLogs = store.logs.filter(l => new Date(l.timestamp).getTime() > fiveMinAgo);
  const totalRequests = recentLogs.length;
  const errorLogs = recentLogs.filter(l => l.statusCode >= 400);
  const errorCount = errorLogs.length;
  const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;
  
  const latencies = recentLogs.map(l => l.latency_ms);
  const avgLatency = latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;
  
  const sortedLatencies = [...latencies].sort((a, b) => a - b);
  const p50 = sortedLatencies[Math.floor(sortedLatencies.length * 0.5)] || 0;
  const p95 = sortedLatencies[Math.floor(sortedLatencies.length * 0.95)] || 0;
  const p99 = sortedLatencies[Math.floor(sortedLatencies.length * 0.99)] || 0;
  
  const requestsPerMinute = [];
  for (let i = 9; i >= 0; i--) {
    const minStart = now - (i + 1) * 60 * 1000;
    const minEnd = now - i * 60 * 1000;
    const count = store.logs.filter(l => {
      const ts = new Date(l.timestamp).getTime();
      return ts >= minStart && ts < minEnd;
    }).length;
    requestsPerMinute.push({
      minute: new Date(minEnd).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      requests: count,
      errors: store.logs.filter(l => {
        const ts = new Date(l.timestamp).getTime();
        return ts >= minStart && ts < minEnd && l.statusCode >= 400;
      }).length,
    });
  }
  
  const activeAlerts = store.alerts.filter(a => !a.resolved).length;
  const criticalAlerts = store.alerts.filter(a => !a.resolved && a.severity === 'critical').length;
  const warningAlerts = store.alerts.filter(a => !a.resolved && a.severity === 'warning').length;
  
  const services = store.services.map(s => ({
    id: s.id,
    name: s.name,
    status: s.status,
    errorRate: s.errorRate,
    avgLatency: s.avgLatency,
    uptime: 99.5 + Math.random() * 0.4,
  }));
  
  const endpointErrors = {};
  recentLogs.filter(l => l.statusCode >= 400).forEach(l => {
    endpointErrors[l.endpoint] = (endpointErrors[l.endpoint] || 0) + 1;
  });
  const topErrorEndpoints = Object.entries(endpointErrors)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([endpoint, count]) => ({ endpoint, count }));
  
  res.json({
    totalRequests,
    errorCount,
    errorRate: parseFloat(errorRate.toFixed(2)),
    avgLatency,
    p50,
    p95,
    p99,
    activeAlerts,
    criticalAlerts,
    warningAlerts,
    requestsPerMinute,
    services,
    topErrorEndpoints,
    lastUpdated: new Date().toISOString(),
  });
});

router.get('/services', (req, res) => {
  res.json(store.services);
});

router.get('/config', (req, res) => {
  res.json(store.config);
});

router.put('/config', (req, res) => {
  const { errorRateThreshold, latencyThreshold, alertCooldown, retentionHours, autoAnalyze } = req.body;
  
  if (errorRateThreshold !== undefined) store.config.errorRateThreshold = parseFloat(errorRateThreshold);
  if (latencyThreshold !== undefined) store.config.latencyThreshold = parseInt(latencyThreshold);
  if (alertCooldown !== undefined) store.config.alertCooldown = parseInt(alertCooldown);
  if (retentionHours !== undefined) store.config.retentionHours = parseInt(retentionHours);
  if (autoAnalyze !== undefined) store.config.autoAnalyze = Boolean(autoAnalyze);
  
  res.json({ success: true, config: store.config });
});

export default router;
