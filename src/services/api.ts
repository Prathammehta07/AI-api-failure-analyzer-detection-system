const API_BASE = '/api';

class ApiService {
  private async fetch<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  // Logs
  async getLogs(params?: { service?: string; endpoint?: string; method?: string; statusCode?: string; search?: string; error?: string; page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, String(value));
      });
    }
    return this.fetch<{ logs: any[]; total: number; page: number; limit: number; totalPages: number }>(`/logs?${queryParams}`);
  }

  async ingestLogs(logs: any | any[]) {
    return this.fetch<{ success: boolean; count: number }>('/logs', {
      method: 'POST',
      body: JSON.stringify(logs),
    });
  }

  async generateLogs(count: number, options?: any) {
    return this.fetch<{ success: boolean; count: number; logs: any[] }>(`/logs/generate?count=${count}`, {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  // Alerts
  async getAlerts(params?: { severity?: string; service?: string; status?: string; page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, String(value));
      });
    }
    return this.fetch<{ alerts: any[]; total: number; active: number; resolved: number; page: number; limit: number; totalPages: number }>(`/alerts?${queryParams}`);
  }

  async getAlert(id: string) {
    return this.fetch<any>(`/alerts/${id}`);
  }

  async acknowledgeAlert(id: string) {
    return this.fetch<{ success: boolean; alert: any }>(`/alerts/${id}/acknowledge`, { method: 'POST' });
  }

  async resolveAlert(id: string) {
    return this.fetch<{ success: boolean; alert: any }>(`/alerts/${id}/resolve`, { method: 'POST' });
  }

  async deleteAlert(id: string) {
    return this.fetch<{ success: boolean }>(`/alerts/${id}`, { method: 'DELETE' });
  }

  // Analysis
  async getAnalyses(params?: { service?: string; alertId?: string; page?: number; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, String(value));
      });
    }
    return this.fetch<{ analyses: any[]; total: number; page: number; limit: number }>(`/analysis?${queryParams}`);
  }

  async getAnalysis(alertId: string) {
    return this.fetch<any>(`/analysis/${alertId}`);
  }

  async triggerAnalysis(alertId: string) {
    return this.fetch<any>(`/analysis/${alertId}`, { method: 'POST' });
  }

  async getDebugSteps(alertId: string) {
    return this.fetch<any>(`/analysis/${alertId}/debug`);
  }

  // Trends
  async getTrends(hours?: number, service?: string) {
    const queryParams = new URLSearchParams();
    if (hours) queryParams.append('hours', String(hours));
    if (service) queryParams.append('service', service);
    return this.fetch<any>(`/trends?${queryParams}`);
  }

  // Metrics
  async getMetrics() {
    return this.fetch<any>('/metrics');
  }

  async getServices() {
    return this.fetch<{ services: any[] }>('/metrics/services');
  }

  async getConfig() {
    return this.fetch<any>('/metrics/config');
  }

  async updateConfig(config: any) {
    return this.fetch<{ success: boolean; config: any }>('/metrics/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  // Health
  async healthCheck() {
    return this.fetch<{ status: string }>('/health');
  }
}

export const api = new ApiService();
