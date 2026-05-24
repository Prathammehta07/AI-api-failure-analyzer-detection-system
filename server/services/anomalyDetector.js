import { v4 as uuidv4 } from 'uuid';
import store from '../data/store.js';

class AnomalyDetector {
  constructor() {
    this.baselineWindowMs = 60 * 60 * 1000;
    this.currentWindowMs = 5 * 60 * 1000;
    this.checkIntervalMs = 30 * 1000;
    this.minOccurrences = 5;
    this.sustainedThresholdMs = 2 * 60 * 1000;
    this.errorHistory = {};
  }

  start() {
    console.log('[AnomalyDetector] Started');
    this.interval = setInterval(() => this.checkAllServices(), this.checkIntervalMs);
    this.calculateBaselines();
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
  }

  calculateBaselines() {
    const now = Date.now();
    const baselineCutoff = now - this.baselineWindowMs;
    
    store.services.forEach(svc => {
      const serviceLogs = store.logs.filter(l =>
        l.service === svc.id && new Date(l.timestamp).getTime() > baselineCutoff
      );
      
      const totalRequests = serviceLogs.length;
      const errorLogs = serviceLogs.filter(l => l.statusCode >= 400);
      const errorRate = totalRequests > 0 ? errorLogs.length / totalRequests : 0;
      
      const latencies = serviceLogs.map(l => l.latency_ms).sort((a, b) => a - b);
      const p50 = this.calculatePercentile(latencies, 50);
      const p95 = this.calculatePercentile(latencies, 95);
      const p99 = this.calculatePercentile(latencies, 99);
      
      store.baselines[svc.id] = {
        errorRate,
        avgLatency: latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0,
        p50,
        p95,
        p99,
        requestVolume: totalRequests,
        calculatedAt: new Date().toISOString(),
      };
    });
  }

  calculatePercentile(sortedArr, p) {
    if (sortedArr.length === 0) return 0;
    const index = Math.ceil((p / 100) * sortedArr.length) - 1;
    return sortedArr[Math.max(0, index)];
  }

  checkAllServices() {
    this.calculateBaselines();
    const now = Date.now();
    const currentCutoff = now - this.currentWindowMs;
    
    store.services.forEach(svc => {
      const serviceLogs = store.logs.filter(l =>
        l.service === svc.id && new Date(l.timestamp).getTime() > currentCutoff
      );
      
      if (serviceLogs.length < this.minOccurrences) return;
      
      const totalRequests = serviceLogs.length;
      const errorLogs = serviceLogs.filter(l => l.statusCode >= 400);
      const currentErrorRate = errorLogs.length / totalRequests;
      const baseline = store.baselines[svc.id];
      
      if (!baseline) return;
      
      const errorRateSpike = baseline.errorRate > 0
        ? currentErrorRate > baseline.errorRate * 1.5
        : currentErrorRate > store.config.errorRateThreshold;
      
      const latencies = serviceLogs.map(l => l.latency_ms).sort((a, b) => a - b);
      const currentP99 = this.calculatePercentile(latencies, 99);
      const latencySpike = currentP99 > store.config.latencyThreshold ||
                          (baseline.p99 > 0 && currentP99 > baseline.p99 * 2);
      
      const volumeSpike = baseline.requestVolume > 0 &&
                         totalRequests > baseline.requestVolume * 3;
      
      if (errorRateSpike || latencySpike || volumeSpike) {
        this.createAlert(svc, {
          errorRateSpike,
          latencySpike,
          volumeSpike,
          currentErrorRate,
          currentP99,
          baselineErrorRate: baseline.errorRate,
          baselineP99: baseline.p99,
          errorLogs,
          totalRequests,
        });
      }
      
      this.updateServiceStatus(svc, currentErrorRate, currentP99);
    });
  }

  updateServiceStatus(svc, errorRate, p99) {
    if (errorRate > store.config.errorRateThreshold * 2 || p99 > store.config.latencyThreshold * 1.5) {
      svc.status = 'critical';
    } else if (errorRate > store.config.errorRateThreshold || p99 > store.config.latencyThreshold) {
      svc.status = 'warning';
    } else {
      svc.status = 'healthy';
    }
    svc.errorRate = errorRate;
    svc.avgLatency = p99;
  }

  createAlert(svc, data) {
    const recentAlert = store.alerts.find(a =>
      a.service === svc.id &&
      !a.resolved &&
      new Date(a.createdAt).getTime() > Date.now() - store.config.alertCooldown * 1000
    );
    
    if (recentAlert) return;
    
    let severity = 'warning';
    let title = '';
    let description = '';
    
    if (data.errorRateSpike && data.latencySpike) {
      severity = 'critical';
      title = `${svc.name} experiencing critical failure`;
      description = `Error rate spiked to ${(data.currentErrorRate * 100).toFixed(1)}% (baseline: ${(data.baselineErrorRate * 100).toFixed(1)}%) and p99 latency reached ${data.currentP99}ms`;
    } else if (data.errorRateSpike) {
      severity = data.currentErrorRate > store.config.errorRateThreshold * 2 ? 'critical' : 'warning';
      title = `${svc.name} error rate spike detected`;
      description = `Error rate is ${(data.currentErrorRate * 100).toFixed(1)}%, ${data.currentErrorRate > data.baselineErrorRate * 1.5 ? `${(data.currentErrorRate / data.baselineErrorRate).toFixed(1)}x above baseline` : 'exceeds threshold'}`;
    } else if (data.latencySpike) {
      severity = 'warning';
      title = `${svc.name} latency degradation`;
      description = `p99 latency is ${data.currentP99}ms, ${data.baselineP99 > 0 ? `${(data.currentP99 / data.baselineP99).toFixed(1)}x above baseline` : 'exceeds threshold'}`;
    } else if (data.volumeSpike) {
      severity = 'warning';
      title = `${svc.name} unusual traffic volume`;
      description = `Request volume is significantly higher than baseline, potential DDoS attack`;
    }
    
    const alert = {
      id: uuidv4(),
      service: svc.id,
      serviceName: svc.name,
      severity,
      title,
      description,
      errorRate: data.currentErrorRate,
      latency: data.currentP99,
      affectedEndpoints: [...new Set(data.errorLogs.map(l => l.endpoint))],
      errorTypes: [...new Set(data.errorLogs.filter(l => l.error_type).map(l => l.error_type))],
      sampleLogs: data.errorLogs.slice(0, 5),
      acknowledged: false,
      resolved: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    store.alerts.unshift(alert);
    store.metrics.activeAlerts = store.alerts.filter(a => !a.resolved).length;
    
    if (store.alerts.length > 100) store.alerts = store.alerts.slice(0, 100);
    
    if (global.wss) {
      global.wss.clients.forEach(client => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({ type: 'alert:new', data: alert }));
        }
      });
    }
    
    console.log(`[Alert] ${severity.toUpperCase()}: ${title}`);
    
    if (severity === 'critical' && store.config.autoAnalyze) {
      import('./aiAnalyzer.js').then(({ default: aiAnalyzer }) => {
        setTimeout(() => aiAnalyzer.analyze(alert.id), 1000);
      });
    }
  }
}

export default new AnomalyDetector();
