export interface LogEntry {
  id: string;
  timestamp: string;
  service: string;
  endpoint: string;
  method: string;
  statusCode: number;
  latency_ms: number;
  error: string | null;
  error_type: string | null;
  request_id: string;
}

export interface Alert {
  id: string;
  service: string;
  serviceName: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  errorRate: number;
  latency: number;
  affectedEndpoints: string[];
  errorTypes: string[];
  sampleLogs: LogEntry[];
  acknowledged: boolean;
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AIAnalysis {
  id: string;
  alertId: string;
  service: string;
  serviceName: string;
  rootCause: string;
  severity: string;
  confidence: number;
  affectedServices: string[];
  probableCauses: { cause: string; likelihood: number }[];
  debuggingSteps: string[];
  remediationActions: {
    immediate: string;
    shortTerm: string;
    longTerm: string;
  };
  relatedLogs: LogEntry[];
  patterns: { type: string; description: string; frequency: number }[];
  createdAt: string;
}

export interface DebugStep {
  order: number;
  description: string;
  command: string;
  expectedOutput: string;
}

export interface DebugGuide {
  alertId: string;
  steps: DebugStep[];
  remediation: {
    immediate: string;
    shortTerm: string;
    longTerm: string;
  };
}

export interface Service {
  id: string;
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  errorRate: number;
  avgLatency: number;
}

export interface MetricData {
  totalRequests: number;
  errorCount: number;
  errorRate: number;
  avgLatency: number;
  p50: number;
  p95: number;
  p99: number;
  activeAlerts: number;
  criticalAlerts: number;
  warningAlerts: number;
  requestsPerMinute: { minute: string; requests: number; errors: number }[];
  services: Service[];
  topErrorEndpoints: { endpoint: string; count: number }[];
  lastUpdated: string;
}

export interface TrendData {
  timeSeries: {
    timestamp: string;
    totalRequests: number;
    errorCount: number;
    errorRate: number;
    avgLatency: number;
    p95: number;
    p99: number;
  }[];
  serviceComparison: {
    service: string;
    serviceId: string;
    totalRequests: number;
    errorCount: number;
    errorRate: number;
    avgLatency: number;
    status: string;
  }[];
  statusCodes: { range: string; count: number }[];
  errorTypes: { type: string; count: number }[];
  latencyBuckets: { bucket: string; count: number }[];
  summary: {
    totalRequests: number;
    totalErrors: number;
    avgErrorRate: number;
    avgLatency: number;
    timeRange: number;
  };
}

export interface AppConfig {
  errorRateThreshold: number;
  latencyThreshold: number;
  alertCooldown: number;
  retentionHours: number;
  autoAnalyze: boolean;
}

export type ViewType = 'dashboard' | 'alerts' | 'analysis' | 'trends' | 'debug' | 'logs' | 'settings';
