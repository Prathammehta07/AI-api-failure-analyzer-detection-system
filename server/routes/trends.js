import express from 'express';
import store from '../data/store.js';

const router = express.Router();

router.get('/', (req, res) => {
  const hours = parseInt(req.query.hours) || 1;
  const service = req.query.service;
  const now = Date.now();
  const cutoff = now - (hours * 60 * 60 * 1000);
  
  let logs = store.logs.filter(l => new Date(l.timestamp).getTime() > cutoff);
  if (service) logs = logs.filter(l => l.service === service);
  
  const intervals = hours <= 1 ? 60 : hours <= 6 ? 36 : hours <= 24 ? 48 : 72;
  const intervalMs = (hours * 60 * 60 * 1000) / intervals;
  
  const timeSeries = [];
  for (let i = 0; i < intervals; i++) {
    const intervalStart = cutoff + (i * intervalMs);
    const intervalEnd = intervalStart + intervalMs;
    
    const intervalLogs = logs.filter(l => {
      const ts = new Date(l.timestamp).getTime();
      return ts >= intervalStart && ts < intervalEnd;
    });
    
    const totalRequests = intervalLogs.length;
    const errorLogs = intervalLogs.filter(l => l.statusCode >= 400);
    const errorCount = errorLogs.length;
    const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;
    
    const latencies = intervalLogs.map(l => l.latency_ms);
    const avgLatency = latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;
    const sortedLatencies = [...latencies].sort((a, b) => a - b);
    const p95 = sortedLatencies[Math.floor(latencies.length * 0.95)] || 0;
    const p99 = sortedLatencies[Math.floor(latencies.length * 0.99)] || 0;
    
    timeSeries.push({
      timestamp: new Date(intervalStart).toISOString(),
      totalRequests,
      errorCount,
      errorRate: parseFloat(errorRate.toFixed(2)),
      avgLatency: Math.round(avgLatency),
      p95: Math.round(p95),
      p99: Math.round(p99),
    });
  }
  
  const serviceComparison = store.services.map(svc => {
    const svcLogs = logs.filter(l => l.service === svc.id);
    const total = svcLogs.length;
    const errors = svcLogs.filter(l => l.statusCode >= 400).length;
    const errorRate = total > 0 ? (errors / total) * 100 : 0;
    const avgLatency = total > 0 ? svcLogs.reduce((sum, l) => sum + l.latency_ms, 0) / total : 0;
    
    return {
      service: svc.name,
      serviceId: svc.id,
      totalRequests: total,
      errorCount: errors,
      errorRate: parseFloat(errorRate.toFixed(2)),
      avgLatency: Math.round(avgLatency),
      status: svc.status,
    };
  }).sort((a, b) => b.errorRate - a.errorRate);
  
  const statusCodes = {};
  logs.forEach(l => {
    const bucket = Math.floor(l.statusCode / 100) * 100;
    const key = `${bucket}-${bucket + 99}`;
    statusCodes[key] = (statusCodes[key] || 0) + 1;
  });
  
  const errorTypes = {};
  logs.filter(l => l.error_type).forEach(l => {
    errorTypes[l.error_type] = (errorTypes[l.error_type] || 0) + 1;
  });
  
  const latencyBuckets = {
    '< 100ms': 0,
    '100-300ms': 0,
    '300-500ms': 0,
    '500-1000ms': 0,
    '1-3s': 0,
    '3-5s': 0,
    '> 5s': 0,
  };
  
  logs.forEach(l => {
    const lat = l.latency_ms;
    if (lat < 100) latencyBuckets['< 100ms']++;
    else if (lat < 300) latencyBuckets['100-300ms']++;
    else if (lat < 500) latencyBuckets['300-500ms']++;
    else if (lat < 1000) latencyBuckets['500-1000ms']++;
    else if (lat < 3000) latencyBuckets['1-3s']++;
    else if (lat < 5000) latencyBuckets['3-5s']++;
    else latencyBuckets['> 5s']++;
  });
  
  res.json({
    timeSeries,
    serviceComparison,
    statusCodes: Object.entries(statusCodes).map(([range, count]) => ({ range, count })),
    errorTypes: Object.entries(errorTypes).map(([type, count]) => ({ type, count })),
    latencyBuckets: Object.entries(latencyBuckets).map(([bucket, count]) => ({ bucket, count })),
    summary: {
      totalRequests: logs.length,
      totalErrors: logs.filter(l => l.statusCode >= 400).length,
      avgErrorRate: logs.length > 0 ? parseFloat(((logs.filter(l => l.statusCode >= 400).length / logs.length) * 100).toFixed(2)) : 0,
      avgLatency: logs.length > 0 ? Math.round(logs.reduce((sum, l) => sum + l.latency_ms, 0) / logs.length) : 0,
      timeRange: hours,
    },
  });
});

export default router;
