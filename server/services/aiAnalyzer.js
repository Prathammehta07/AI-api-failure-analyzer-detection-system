import { v4 as uuidv4 } from 'uuid';
import store from '../data/store.js';

const ROOT_CAUSES = {
  'DatabaseError': {
    causes: [
      { cause: 'Database connection pool exhausted', likelihood: 0.92 },
      { cause: 'Database server overloaded', likelihood: 0.78 },
      { cause: 'Slow query execution', likelihood: 0.65 },
      { cause: 'Database deadlock detected', likelihood: 0.45 },
    ],
    debuggingSteps: [
      'Check database connection pool status: SELECT count(*) FROM information_schema.processlist;',
      'Verify database server CPU and memory usage',
      'Review slow query log for recent queries',
      'Check for long-running transactions',
      'Verify database indexes on frequently queried tables',
    ],
    remediation: {
      immediate: 'Restart database connection pool or increase pool size',
      shortTerm: 'Optimize slow queries and add missing indexes',
      longTerm: 'Implement database read replicas and connection pooling',
    },
  },
  'TimeoutError': {
    causes: [
      { cause: 'External API dependency timeout', likelihood: 0.88 },
      { cause: 'Network latency between services', likelihood: 0.72 },
      { cause: 'Service mesh proxy timeout', likelihood: 0.55 },
      { cause: 'DNS resolution failure', likelihood: 0.35 },
    ],
    debuggingSteps: [
      'Check external service health endpoints',
      'Verify network connectivity between services',
      'Review timeout configurations in service mesh',
      'Check DNS resolution times',
      'Monitor network latency with ping/traceroute',
    ],
    remediation: {
      immediate: 'Increase timeout values or implement circuit breaker',
      shortTerm: 'Add retry logic with exponential backoff',
      longTerm: 'Implement service mesh with automatic failover',
    },
  },
  'AuthError': {
    causes: [
      { cause: 'JWT token validation failure', likelihood: 0.85 },
      { cause: 'Authentication service degradation', likelihood: 0.70 },
      { cause: 'Rate limiting triggered', likelihood: 0.60 },
      { cause: 'API key rotation in progress', likelihood: 0.40 },
    ],
    debuggingSteps: [
      'Verify JWT token expiry and signature',
      'Check authentication service health',
      'Review rate limiting configuration',
      'Validate API keys and permissions',
      'Check for recent authentication service deployments',
    ],
    remediation: {
      immediate: 'Refresh tokens or bypass auth for internal traffic',
      shortTerm: 'Scale authentication service horizontally',
      longTerm: 'Implement token caching and distributed auth',
    },
  },
  'ValidationError': {
    causes: [
      { cause: 'Schema mismatch between services', likelihood: 0.80 },
      { cause: 'Recent API contract change', likelihood: 0.75 },
      { cause: 'Invalid client request payload', likelihood: 0.65 },
      { cause: 'Missing required fields in request', likelihood: 0.55 },
    ],
    debuggingSteps: [
      'Compare request schema with API specification',
      'Check for recent API version deployments',
      'Validate request payloads against schema',
      'Review client-side request formatting',
      'Check for backward compatibility breaks',
    ],
    remediation: {
      immediate: 'Rollback recent API changes if applicable',
      shortTerm: 'Update API documentation and client libraries',
      longTerm: 'Implement schema validation and API versioning',
    },
  },
  'ServerError': {
    causes: [
      { cause: 'Application code exception', likelihood: 0.90 },
      { cause: 'Memory leak or resource exhaustion', likelihood: 0.75 },
      { cause: 'Unhandled edge case in business logic', likelihood: 0.65 },
      { cause: 'Dependency version conflict', likelihood: 0.50 },
    ],
    debuggingSteps: [
      'Check application error logs for stack traces',
      'Monitor memory and CPU usage trends',
      'Review recent code deployments',
      'Check for unhandled exceptions in error tracking',
      'Verify all service dependencies are healthy',
    ],
    remediation: {
      immediate: 'Restart affected service instances',
      shortTerm: 'Deploy hotfix for identified bug',
      longTerm: 'Improve error handling and add integration tests',
    },
  },
};

const GENERIC_ANALYSIS = {
  causes: [
    { cause: 'Service dependency failure', likelihood: 0.70 },
    { cause: 'Infrastructure issue', likelihood: 0.60 },
    { cause: 'Recent deployment regression', likelihood: 0.55 },
  ],
  debuggingSteps: [
    'Check service health endpoints',
    'Review recent deployments',
    'Monitor infrastructure metrics',
    'Check dependent service status',
    'Review application logs for errors',
  ],
  remediation: {
    immediate: 'Restart service and check dependencies',
    shortTerm: 'Investigate root cause from logs and metrics',
    longTerm: 'Improve monitoring and alerting coverage',
  },
};

class AIAnalyzer {
  async analyze(alertId) {
    const alert = store.alerts.find(a => a.id === alertId);
    if (!alert) return null;
    
    const existing = store.analyses.find(a => a.alertId === alertId);
    if (existing) return existing;
    
    const alertTime = new Date(alert.createdAt).getTime();
    const relatedLogs = store.logs.filter(l => {
      const logTime = new Date(l.timestamp).getTime();
      return l.service === alert.service && Math.abs(logTime - alertTime) < 5 * 60 * 1000;
    });
    
    const errorTypes = alert.errorTypes || [];
    const primaryErrorType = errorTypes.length > 0 ? errorTypes[0] : 'ServerError';
    const template = ROOT_CAUSES[primaryErrorType] || GENERIC_ANALYSIS;
    
    const dataPoints = relatedLogs.length;
    const hasErrors = relatedLogs.some(l => l.error);
    const confidence = this.calculateConfidence(dataPoints, hasErrors, alert.severity);
    
    const analysis = {
      id: uuidv4(),
      alertId,
      service: alert.service,
      serviceName: alert.serviceName,
      rootCause: this.generateRootCauseSummary(alert, template, relatedLogs),
      severity: alert.severity,
      confidence,
      affectedServices: this.findAffectedServices(relatedLogs),
      probableCauses: template.causes,
      debuggingSteps: template.debuggingSteps,
      remediationActions: template.remediation,
      relatedLogs: relatedLogs.slice(0, 10),
      patterns: this.detectPatterns(relatedLogs),
      createdAt: new Date().toISOString(),
    };
    
    store.analyses.unshift(analysis);
    if (store.analyses.length > 50) store.analyses = store.analyses.slice(0, 50);
    
    if (global.wss) {
      global.wss.clients.forEach(client => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({ type: 'analysis:complete', data: analysis }));
        }
      });
    }
    
    console.log(`[AI Analysis] Completed for alert ${alertId} with confidence ${(confidence * 100).toFixed(0)}%`);
    return analysis;
  }

  calculateConfidence(dataPoints, hasErrors, severity) {
    let base = 0.75;
    if (dataPoints > 50) base += 0.10;
    else if (dataPoints > 20) base += 0.05;
    if (hasErrors) base += 0.05;
    if (severity === 'critical') base += 0.03;
    base += (Math.random() * 0.05 - 0.025);
    return Math.min(0.98, Math.max(0.70, base));
  }

  generateRootCauseSummary(alert, template, logs) {
    const topCause = template.causes[0];
    const errorType = logs.find(l => l.error_type)?.error_type || 'unknown error';
    const summaries = {
      'DatabaseError': `Database connectivity issues detected. ${topCause.cause} is the most probable root cause, affecting ${alert.affectedEndpoints?.length || 1} endpoint(s).`,
      'TimeoutError': `Service timeouts detected. ${topCause.cause} likely causing cascading latency increases across dependent services.`,
      'AuthError': `Authentication failures detected. ${topCause.cause} may be preventing legitimate requests from being processed.`,
      'ValidationError': `Request validation failures detected. ${topCause.cause} suggests a potential API contract mismatch.`,
      'ServerError': `Internal server errors detected. ${topCause.cause} indicates a possible code-level issue requiring immediate investigation.`,
    };
    return summaries[errorType] || `Multiple error patterns detected in ${alert.serviceName}. ${topCause.cause} is the primary suspect based on error correlation analysis.`;
  }

  findAffectedServices(logs) {
    const services = [...new Set(logs.map(l => l.service))];
    return services.map(id => {
      const svc = store.services.find(s => s.id === id);
      return svc ? svc.name : id;
    });
  }

  detectPatterns(logs) {
    const patterns = [];
    
    const errorCounts = {};
    logs.filter(l => l.error).forEach(l => {
      const key = l.error_type || 'unknown';
      errorCounts[key] = (errorCounts[key] || 0) + 1;
    });
    
    Object.entries(errorCounts).forEach(([type, count]) => {
      if (count > 5) {
        patterns.push({ type: 'recurring_error', description: `${type} occurred ${count} times`, frequency: count });
      }
    });
    
    const endpointCounts = {};
    logs.forEach(l => { endpointCounts[l.endpoint] = (endpointCounts[l.endpoint] || 0) + 1; });
    const topEndpoint = Object.entries(endpointCounts).sort((a, b) => b[1] - a[1])[0];
    if (topEndpoint && topEndpoint[1] > logs.length * 0.5) {
      patterns.push({ type: 'endpoint_concentration', description: `Errors concentrated on ${topEndpoint[0]} (${((topEndpoint[1] / logs.length) * 100).toFixed(0)}%)`, frequency: topEndpoint[1] });
    }
    
    const statusCodes = {};
    logs.forEach(l => { statusCodes[l.statusCode] = (statusCodes[l.statusCode] || 0) + 1; });
    const topStatus = Object.entries(statusCodes).sort((a, b) => b[1] - a[1])[0];
    if (topStatus) {
      patterns.push({ type: 'status_code_pattern', description: `HTTP ${topStatus[0]} dominates (${((topStatus[1] / logs.length) * 100).toFixed(0)}%)`, frequency: topStatus[1] });
    }
    
    return patterns;
  }

  async generateDebugSteps(alertId) {
    const analysis = store.analyses.find(a => a.alertId === alertId);
    if (!analysis) return null;
    
    return {
      alertId,
      steps: analysis.debuggingSteps.map((step, index) => ({
        order: index + 1,
        description: step,
        command: this.generateCommand(step, analysis.service),
        expectedOutput: this.generateExpectedOutput(step),
      })),
      remediation: analysis.remediationActions,
    };
  }

  generateCommand(step, service) {
    const commands = {
      'database': `kubectl logs -n production deployment/${service} --tail=100 | grep -i "error"`,
      'connection pool': `curl -s http://${service}/health | jq .`,
      'timeout': `curl -w "@curl-format.txt" -o /dev/null -s http://${service}/api/health`,
      'JWT': `jwt decode $(curl -s http://${service}/api/token | jq -r .token)`,
      'schema': `curl -s http://${service}/api/schema | jq .`,
      'memory': `kubectl top pod -n production -l app=${service}`,
    };
    
    for (const [key, cmd] of Object.entries(commands)) {
      if (step.toLowerCase().includes(key)) return cmd;
    }
    return `# Check ${service} logs\nkubectl logs -n production deployment/${service} --tail=50`;
  }

  generateExpectedOutput(step) {
    const outputs = {
      'database': 'Active connections: 45/50, Slow queries: 3',
      'connection pool': '{"status": "healthy", "pool_size": 50, "active": 48}',
      'timeout': 'time_total: 8.234s (should be < 1s)',
      'JWT': '{"exp": 1699900000, "iat": 1699800000}',
      'schema': '{"version": "2.1.0", "endpoints": 12}',
      'memory': 'CPU: 85%, Memory: 1.2Gi / 2Gi',
    };
    
    for (const [key, output] of Object.entries(outputs)) {
      if (step.toLowerCase().includes(key)) return output;
    }
    return 'Check output for errors or anomalies';
  }
}

export default new AIAnalyzer();
