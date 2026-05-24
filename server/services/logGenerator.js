import { v4 as uuidv4 } from 'uuid';
import store from '../data/store.js';

const ENDPOINTS = {
  'user-api': ['/api/v1/users/profile', '/api/v1/users/login', '/api/v1/users/register', '/api/v1/users/settings'],
  'payment-api': ['/api/v1/payments/process', '/api/v1/payments/refund', '/api/v1/payments/history'],
  'order-api': ['/api/v1/orders/create', '/api/v1/orders/cancel', '/api/v1/orders/status', '/api/v1/orders/list'],
  'inventory-api': ['/api/v1/inventory/check', '/api/v1/inventory/update', '/api/v1/inventory/reserve'],
  'notification-api': ['/api/v1/notify/send', '/api/v1/notify/push', '/api/v1/notify/email'],
  'auth-api': ['/api/v1/auth/token', '/api/v1/auth/refresh', '/api/v1/auth/verify'],
  'search-api': ['/api/v1/search/query', '/api/v1/search/suggest', '/api/v1/search/filters'],
  'analytics-api': ['/api/v1/analytics/events', '/api/v1/analytics/reports', '/api/v1/analytics/metrics'],
};

const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

const ERROR_TYPES = {
  'DatabaseError': ['Connection timeout on {service}_db', 'Deadlock detected in transaction', 'Connection pool exhausted', 'Query execution timeout'],
  'TimeoutError': ['Request timeout after {latency}ms', 'External API timeout', 'Upstream service unavailable'],
  'AuthError': ['JWT token expired', 'Invalid API key', 'Permission denied for resource', 'Rate limit exceeded'],
  'ValidationError': ['Invalid request payload', 'Missing required field: {field}', 'Schema validation failed', 'Invalid parameter format'],
  'ServerError': ['Internal server error', 'Memory limit exceeded', 'Unhandled exception in handler', 'Service temporarily unavailable'],
};

const STATUS_CODES = {
  success: [200, 201, 204],
  clientError: [400, 401, 403, 404, 409, 422],
  serverError: [500, 502, 503, 504],
};

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateError(service, statusCode, latency) {
  const errorKeys = Object.keys(ERROR_TYPES);
  const errorType = randomChoice(errorKeys);
  const templates = ERROR_TYPES[errorType];
  let message = randomChoice(templates);
  message = message.replace('{service}', service).replace('{latency}', latency).replace('{field}', randomChoice(['id', 'name', 'email', 'amount']));
  return { errorType, message };
}

export function generateLog(options = {}) {
  const service = options.service || randomChoice(Object.keys(ENDPOINTS));
  const endpoint = options.endpoint || randomChoice(ENDPOINTS[service]);
  const method = options.method || randomChoice(METHODS);
  
  const isError = options.forceError || Math.random() < (store.config.errorRateThreshold * 0.5 + 0.02);
  
  let statusCode;
  let latency;
  let error = null;
  let errorType = null;
  
  if (isError) {
    const errorCategory = Math.random() < 0.7 ? 'serverError' : 'clientError';
    statusCode = randomChoice(STATUS_CODES[errorCategory]);
    latency = randomInt(2000, 12000);
    const err = generateError(service, statusCode, latency);
    error = err.message;
    errorType = err.errorType;
  } else {
    statusCode = randomChoice(STATUS_CODES.success);
    latency = randomInt(20, 500);
  }
  
  return {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    service,
    endpoint,
    method,
    statusCode,
    latency_ms: latency,
    error,
    error_type: errorType,
    request_id: `req_${uuidv4().slice(0, 8)}`,
  };
}

export function generateBatch(count = 10, options = {}) {
  const logs = [];
  for (let i = 0; i < count; i++) {
    logs.push(generateLog(options));
  }
  return logs;
}

export function simulateFailure(service, duration = 5) {
  const logs = [];
  const errorType = randomChoice(Object.keys(ERROR_TYPES));
  
  for (let i = 0; i < duration; i++) {
    const endpoint = randomChoice(ENDPOINTS[service]);
    const method = randomChoice(METHODS);
    const statusCode = randomChoice(STATUS_CODES.serverError);
    const latency = randomInt(5000, 15000);
    const templates = ERROR_TYPES[errorType];
    const message = randomChoice(templates).replace('{service}', service).replace('{latency}', latency);
    
    logs.push({
      id: uuidv4(),
      timestamp: new Date(Date.now() - (duration - i) * 60000).toISOString(),
      service,
      endpoint,
      method,
      statusCode,
      latency_ms: latency,
      error: message,
      error_type: errorType,
      request_id: `req_${uuidv4().slice(0, 8)}`,
    });
  }
  
  return logs;
}

export { ENDPOINTS, ERROR_TYPES };
