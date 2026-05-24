import { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api';
import { wsService } from '@/services/websocket';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Activity, AlertTriangle, TrendingUp, TrendingDown, Clock,
  Zap, Server, ChevronRight, AlertCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { MetricData, Alert } from '@/types';

function MetricCard({ title, value, subtitle, icon: Icon, trend, color }: {
  title: string; value: string | number; subtitle: string; icon: any; trend?: 'up' | 'down' | 'neutral'; color: string;
}) {
  const colorMap: Record<string, string> = {
    emerald: 'text-emerald-500 bg-emerald-500/10',
    red: 'text-red-500 bg-red-500/10',
    blue: 'text-blue-500 bg-blue-500/10',
    amber: 'text-amber-500 bg-amber-500/10',
  };

  return (
    <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-5 hover:border-[hsl(var(--accent))] transition-all duration-200 hover:-translate-y-0.5">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs ${trend === 'up' ? 'text-red-500' : 'text-emerald-500'}`}>
            {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend === 'up' ? '+' : '-'}{Math.floor(Math.random() * 15)}%
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-[hsl(var(--foreground))] mb-1">{value}</div>
      <div className="text-xs text-[hsl(var(--muted-foreground)]">{title}</div>
      <div className="text-[11px] text-[hsl(var(--muted-foreground)] mt-1">{subtitle}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    healthy: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${colors[status] || colors.healthy}`}>
      {status}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    critical: 'bg-red-500/20 text-red-400',
    warning: 'bg-amber-500/20 text-amber-400',
    info: 'bg-blue-500/20 text-blue-400',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${colors[severity] || colors.info}`}>
      {severity}
    </span>
  );
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState<MetricData | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [metricsData, alertsData] = await Promise.all([
        api.getMetrics(),
        api.getAlerts({ status: 'active', limit: 10 }),
      ]);
      setMetrics(metricsData);
      setAlerts(alertsData.alerts);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);

    wsService.on('alert:new', () => fetchData());
    wsService.on('metric:update', () => fetchData());

    return () => {
      clearInterval(interval);
      wsService.off('alert:new', fetchData);
      wsService.off('metric:update', fetchData);
    };
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-5 animate-pulse">
              <div className="h-10 w-10 bg-[hsl(var(--border))] rounded-lg mb-3" />
              <div className="h-8 w-24 bg-[hsl(var(--border))] rounded mb-2" />
              <div className="h-4 w-16 bg-[hsl(var(--border))] rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const requestData = metrics?.requestsPerMinute || [];
  const serviceHealth = metrics?.services || [];

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          title="Total Requests (5m)"
          value={metrics?.totalRequests?.toLocaleString() || 0}
          subtitle="Last 5 minutes"
          icon={Activity}
          color="blue"
          trend="neutral"
        />
        <MetricCard
          title="Error Rate"
          value={`${metrics?.errorRate?.toFixed(2) || 0}%`}
          subtitle={`${metrics?.errorCount || 0} errors`}
          icon={AlertTriangle}
          color={metrics && metrics.errorRate > 5 ? 'red' : 'amber'}
          trend={metrics && metrics.errorRate > 1 ? 'up' : 'down'}
        />
        <MetricCard
          title="Avg Latency"
          value={`${metrics?.avgLatency || 0}ms`}
          subtitle={`p95: ${metrics?.p95 || 0}ms`}
          icon={Clock}
          color={metrics && metrics.avgLatency > 1000 ? 'amber' : 'emerald'}
          trend="neutral"
        />
        <MetricCard
          title="Active Alerts"
          value={metrics?.activeAlerts || 0}
          subtitle={`${metrics?.criticalAlerts || 0} critical`}
          icon={Zap}
          color={metrics && metrics.activeAlerts > 0 ? 'red' : 'emerald'}
          trend={metrics && metrics.activeAlerts > 0 ? 'up' : 'down'}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Main Chart */}
        <div className="col-span-2 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-5">
          <h3 className="text-[hsl(var(--foreground))] font-semibold text-sm mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" />
            Request Volume & Error Rate
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={requestData}>
              <defs>
                <linearGradient id="reqGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="errGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="minute" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '6px', fontSize: '12px' }}
                labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
              />
              <Area type="monotone" dataKey="requests" stroke="#3b82f6" strokeWidth={2} fill="url(#reqGradient)" />
              <Area type="monotone" dataKey="errors" stroke="#ef4444" strokeWidth={2} fill="url(#errGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Service Health */}
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-5">
          <h3 className="text-[hsl(var(--foreground))] font-semibold text-sm mb-4 flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-500" />
            Service Health
          </h3>
          <div className="space-y-3">
            {serviceHealth.map(svc => (
              <div key={svc.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    svc.status === 'healthy' ? 'bg-emerald-500' :
                    svc.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                  }`} />
                  <span className="text-sm text-[hsl(var(--foreground))]">{svc.name}</span>
                </div>
                <StatusBadge status={svc.status} />
              </div>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="mt-6 pt-4 border-t border-[hsl(var(--border))] space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-[hsl(var(--muted-foreground))]">Top Error Endpoint</span>
              <span className="text-[hsl(var(--foreground))] font-mono truncate max-w-[120px]">
                {metrics?.topErrorEndpoints?.[0]?.endpoint || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[hsl(var(--muted-foreground))]">Error Count</span>
              <span className="text-red-500 font-mono">{metrics?.topErrorEndpoints?.[0]?.count || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[hsl(var(--foreground))] font-semibold text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            Recent Alerts
          </h3>
          <button className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] flex items-center gap-1 transition-colors">
            View All <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {alerts.length === 0 ? (
          <div className="text-center py-8 text-[hsl(var(--muted-foreground))]">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No active alerts - all systems operational</p>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.slice(0, 5).map(alert => (
              <div
                key={alert.id}
                className={`flex items-center gap-4 p-3 rounded-lg border-l-2 ${
                  alert.severity === 'critical'
                    ? 'bg-red-500/5 border-red-500'
                    : alert.severity === 'warning'
                    ? 'bg-amber-500/5 border-amber-500'
                    : 'bg-blue-500/5 border-blue-500'
                }`}
              >
                <SeverityBadge severity={alert.severity} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[hsl(var(--foreground))] truncate">{alert.title}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{alert.description}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-[hsl(var(--muted-foreground))] font-mono">{alert.serviceName}</p>
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                    {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
