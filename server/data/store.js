const store = {
  logs: [],
  alerts: [
    {
      id: 'alert-1',
      service: 'user-api',
      serviceName: 'User API',
      severity: 'critical',
      title: 'User API experiencing critical failure',
      description: 'Error rate spiked to 25.3% and p99 latency reached 842ms',
      errorRate: 0.253,
      latency: 842,
      affectedEndpoints: ['/api/users', '/api/profile'],
      errorTypes: ['500 Internal Server Error', '503 Service Unavailable'],
      sampleLogs: [
        { timestamp: new Date(Date.now() - 30000).toISOString(), service: 'user-api', endpoint: '/api/users', method: 'GET', statusCode: 500, latency_ms: 842, error: 'Database connection timeout', error_type: '500 Internal Server Error', request_id: 'req-123' },
        { timestamp: new Date(Date.now() - 25000).toISOString(), service: 'user-api', endpoint: '/api/profile', method: 'GET', statusCode: 503, latency_ms: 721, error: 'Service unavailable', error_type: '503 Service Unavailable', request_id: 'req-456' }
      ],
      acknowledged: false,
      resolved: false,
      createdAt: new Date(Date.now() - 60000).toISOString(),
      updatedAt: new Date(Date.now() - 60000).toISOString()
    },
    {
      id: 'alert-2',
      service: 'payment-api',
      serviceName: 'Payment API',
      severity: 'critical',
      title: 'Payment API experiencing critical failure',
      description: 'Error rate spiked to 32.1% and p99 latency reached 1245ms',
      errorRate: 0.321,
      latency: 1245,
      affectedEndpoints: ['/api/transactions', '/api/webhooks'],
      errorTypes: ['500 Internal Server Error', '504 Gateway Timeout'],
      sampleLogs: [
        { timestamp: new Date(Date.now() - 20000).toISOString(), service: 'payment-api', endpoint: '/api/transactions', method: 'POST', statusCode: 500, latency_ms: 1245, error: 'Payment processing service unavailable', error_type: '500 Internal Server Error', request_id: 'req-567' },
        { timestamp: new Date(Date.now() - 18000).toISOString(), service: 'payment-api', endpoint: '/api/webhooks', method: 'POST', statusCode: 504, latency_ms: 1123, error: 'Webhook delivery timeout', error_type: '504 Gateway Timeout', request_id: 'req-890' }
      ],
      acknowledged: false,
      resolved: false,
      createdAt: new Date(Date.now() - 50000).toISOString(),
      updatedAt: new Date(Date.now() - 50000).toISOString()
    },
    {
      id: 'alert-3',
      service: 'order-api',
      serviceName: 'Order API',
      severity: 'critical',
      title: 'Order API experiencing critical failure',
      description: 'Error rate spiked to 28.7% and p99 latency reached 987ms',
      errorRate: 0.287,
      latency: 987,
      affectedEndpoints: ['/api/orders', '/api/shipments'],
      errorTypes: ['500 Internal Server Error', '503 Service Unavailable'],
      sampleLogs: [
        { timestamp: new Date(Date.now() - 15000).toISOString(), service: 'order-api', endpoint: '/api/orders', method: 'POST', statusCode: 500, latency_ms: 987, error: 'Order database connection failed', error_type: '500 Internal Server Error', request_id: 'req-112' },
        { timestamp: new Date(Date.now() - 12000).toISOString(), service: 'order-api', endpoint: '/api/shipments', method: 'PUT', statusCode: 503, latency_ms: 865, error: 'Shipment service unavailable', error_type: '503 Service Unavailable', request_id: 'req-334' }
      ],
      acknowledged: false,
      resolved: false,
      createdAt: new Date(Date.now() - 40000).toISOString(),
      updatedAt: new Date(Date.now() - 40000).toISOString()
    },
    {
      id: 'alert-4',
      service: 'notification-api',
      serviceName: 'Notification API',
      severity: 'info',
      title: 'Notification API unusual traffic volume',
      description: 'Request volume is significantly higher than baseline, potential DDoS attack',
      errorRate: 0.015,
      latency: 89,
      affectedEndpoints: ['/api/notifications'],
      errorTypes: [],
      sampleLogs: [
        { timestamp: new Date(Date.now() - 10000).toISOString(), service: 'notification-api', endpoint: '/api/notifications', method: 'POST', statusCode: 200, latency_ms: 89, error: null, error_type: null, request_id: 'req-445' }
      ],
      acknowledged: false,
      resolved: false,
      createdAt: new Date(Date.now() - 150000).toISOString(),
      updatedAt: new Date(Date.now() - 150000).toISOString()
    },
    {
      id: 'alert-5',
      service: 'analytics-api',
      serviceName: 'Analytics API',
      severity: 'info',
      title: 'Analytics API unusual traffic volume',
      description: 'Request volume is significantly higher than baseline, potential DDoS attack',
      errorRate: 0.018,
      latency: 102,
      affectedEndpoints: ['/api/analytics'],
      errorTypes: [],
      sampleLogs: [
        { timestamp: new Date(Date.now() - 8000).toISOString(), service: 'analytics-api', endpoint: '/api/analytics', method: 'GET', statusCode: 200, latency_ms: 102, error: null, error_type: null, request_id: 'req-556' }
      ],
      acknowledged: false,
      resolved: false,
      createdAt: new Date(Date.now() - 120000).toISOString(),
      updatedAt: new Date(Date.now() - 120000).toISOString()
    },
    {
      id: 'alert-6',
      service: 'search-api',
      serviceName: 'Search API',
      severity: 'info',
      title: 'Search API unusual traffic volume',
      description: 'Request volume is significantly higher than baseline, potential DDoS attack',
      errorRate: 0.021,
      latency: 124,
      affectedEndpoints: ['/api/search'],
      errorTypes: [],
      sampleLogs: [
        { timestamp: new Date(Date.now() - 15000).toISOString(), service: 'search-api', endpoint: '/api/search', method: 'GET', statusCode: 200, latency_ms: 124, error: null, error_type: null, request_id: 'req-345' }
      ],
      acknowledged: false,
      resolved: false,
      createdAt: new Date(Date.now() - 180000).toISOString(),
      updatedAt: new Date(Date.now() - 180000).toISOString()
    }
  ],
  analyses: [],
  baselines: {},
  services: [
    { id: 'user-api', name: 'User API', status: 'healthy', errorRate: 0.2, avgLatency: 120 },
    { id: 'payment-api', name: 'Payment API', status: 'healthy', errorRate: 0.1, avgLatency: 200 },
    { id: 'order-api', name: 'Order API', status: 'healthy', errorRate: 0.3, avgLatency: 150 },
    { id: 'inventory-api', name: 'Inventory API', status: 'healthy', errorRate: 0.15, avgLatency: 180 },
    { id: 'notification-api', name: 'Notification API', status: 'healthy', errorRate: 0.25, avgLatency: 90 },
    { id: 'auth-api', name: 'Auth API', status: 'healthy', errorRate: 0.05, avgLatency: 60 },
    { id: 'search-api', name: 'Search API', status: 'healthy', errorRate: 0.4, avgLatency: 300 },
    { id: 'analytics-api', name: 'Analytics API', status: 'healthy', errorRate: 0.2, avgLatency: 250 },
  ],
  config: {
    errorRateThreshold: 0.15,
    latencyThreshold: 5000,
    alertCooldown: 120,
    retentionHours: 24,
    autoAnalyze: true,
  },
  metrics: {
    totalRequests: 0,
    errorRate: 0,
    avgLatency: 0,
    activeAlerts: 0,
    requestsPerMinute: [],
    errorsPerMinute: [],
  }
};

export default store;
