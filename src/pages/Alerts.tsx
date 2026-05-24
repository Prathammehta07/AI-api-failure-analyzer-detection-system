import { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api';
import { wsService } from '@/services/websocket';
import {
  AlertTriangle, AlertCircle, Info, CheckCircle, Filter,
  Clock, Server, ChevronRight, RotateCcw,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Alert } from '@/types';

function SeverityIcon({ severity }: { severity: string }) {
  switch (severity) {
    case 'critical': return <AlertTriangle className="w-5 h-5 text-red-400" />;
    case 'warning': return <AlertCircle className="w-5 h-5 text-amber-400" />;
    default: return <Info className="w-5 h-5 text-blue-400" />;
  }
}

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${colors[severity] || colors.info}`}>
      {severity}
    </span>
  );
}

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, resolved: 0 });
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    try {
      const data = await api.getAlerts({
        severity: severityFilter || undefined,
        status: statusFilter || undefined,
        limit: 50,
      });
      setAlerts(data.alerts);
      setStats({ total: data.total, active: data.active, resolved: data.resolved });
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      setLoading(false);
    }
  }, [severityFilter, statusFilter]);

  useEffect(() => {
    fetchAlerts();
    wsService.on('alert:new', fetchAlerts);
    return () => {
      wsService.off('alert:new', fetchAlerts);
    };
  }, [fetchAlerts]);

  const [resolving, setResolving] = useState<Record<string, boolean>>({});

  const handleResolve = async (id: string) => {
    console.log('[Alerts] Resolving alert:', id);
    try {
      setResolving(prev => ({ ...prev, [id]: true }));
      await api.resolveAlert(id);
      console.log('[Alerts] Alert resolved successfully:', id);
      fetchAlerts();
      if (selectedAlert?.id === id) setSelectedAlert(null);
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    } finally {
      setResolving(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleAcknowledge = async (id: string) => {
    try {
      await api.acknowledgeAlert(id);
      fetchAlerts();
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{stats.active}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground)]">Active Alerts</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
          </div>
        </div>
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{stats.total}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground)]">Total Alerts</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-500" />
            </div>
          </div>
        </div>
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{stats.resolved}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground)]">Resolved</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground)]">
          <Filter className="w-4 h-4" />
          <span className="text-xs">Filters:</span>
        </div>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg px-3 py-1.5 text-xs text-[hsl(var(--foreground))] focus:outline-none focus:border-[hsl(var(--accent))]"
        >
          <option value="">All Severities</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg px-3 py-1.5 text-xs text-[hsl(var(--foreground))] focus:outline-none focus:border-[hsl(var(--accent))]"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="resolved">Resolved</option>
        </select>
        <button
          onClick={() => { setSeverityFilter(''); setStatusFilter('active'); }}
          className="text-xs text-[hsl(var(--muted-foreground)] hover:text-[hsl(var(--foreground))] flex items-center gap-1 transition-colors"
        >
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
      </div>

      {/* Alert List */}
      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg">
        {loading ? (
          <div className="p-8 text-center text-[hsl(var(--muted-foreground)]">Loading alerts...</div>
        ) : alerts.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <p className="text-[hsl(var(--foreground)] font-medium">No alerts found</p>
            <p className="text-xs text-[hsl(var(--muted-foreground)] mt-1">All systems are operating normally</p>
          </div>
        ) : (
          <div className="divide-y divide-[hsl(var(--border))]">
            {alerts.map(alert => (
              <div
                key={alert.id}
                className={`p-4 hover:bg-[hsl(var(--accent))] transition-colors cursor-pointer ${
                  selectedAlert?.id === alert.id ? 'bg-[hsl(var(--accent))] ' : ''
                }`}
                onClick={() => setSelectedAlert(selectedAlert?.id === alert.id ? null : alert)}
              >
                <div className="flex items-start gap-3">
                  <SeverityIcon severity={alert.severity} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <SeverityBadge severity={alert.severity} />
                      <span className="text-xs text-[hsl(var(--muted-foreground)]">{alert.serviceName}</span>
                      {alert.acknowledged && (
                        <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">Acknowledged</span>
                      )}
                    </div>
                    <p className="text-sm text-[hsl(var(--foreground))] font-medium mb-1">{alert.title}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground)] line-clamp-2">{alert.description}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-[10px] text-[hsl(var(--muted-foreground)] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                      </span>
                      <span className="text-[10px] text-[hsl(var(--muted-foreground)] flex items-center gap-1">
                        <Server className="w-3 h-3" />
                        {alert.affectedEndpoints?.length || 0} endpoints
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!alert.acknowledged && !alert.resolved && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAcknowledge(alert.id); }}
                        className="text-xs text-[hsl(var(--muted-foreground))] hover:text-emerald-500 transition-colors px-2 py-1 rounded hover:bg-emerald-500/10"
                      >
                        Ack
                      </button>
                    )}
                    {!alert.resolved && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleResolve(alert.id); }}
                        disabled={resolving[alert.id]}
                        className={`text-xs text-[hsl(var(--muted-foreground))] hover:text-emerald-500 transition-colors px-2 py-1 rounded hover:bg-emerald-500/10 ${resolving[alert.id] ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {resolving[alert.id] ? 'Resolving...' : 'Resolve'}
                      </button>
                    )}
                    <ChevronRight className={`w-4 h-4 text-[hsl(var(--muted-foreground)] transition-transform ${selectedAlert?.id === alert.id ? 'rotate-90' : ''}`} />
                  </div>
                </div>

                {/* Expanded Detail */}
                {selectedAlert?.id === alert.id && (
                  <div className="mt-4 pt-4 border-t border-[hsl(var(--border))] pl-8">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-[10px] text-[hsl(var(--muted-foreground)] uppercase tracking-wider mb-1">Error Rate</p>
                        <p className="text-sm text-[hsl(var(--foreground))] font-mono">{(alert.errorRate * 100).toFixed(2)}%</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[hsl(var(--muted-foreground)] uppercase tracking-wider mb-1">Latency</p>
                        <p className="text-sm text-[hsl(var(--foreground))] font-mono">{alert.latency}ms</p>
                      </div>
                    </div>

                    {alert.errorTypes?.length > 0 && (
                      <div className="mb-4">
                        <p className="text-[10px] text-[hsl(var(--muted-foreground)] uppercase tracking-wider mb-2">Error Types</p>
                        <div className="flex flex-wrap gap-2">
                          {alert.errorTypes.map((type, i) => (
                            <span key={i} className="text-xs bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground)] px-2 py-1 rounded border border-[hsl(var(--border))]">
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {alert.affectedEndpoints?.length > 0 && (
                      <div className="mb-4">
                        <p className="text-[10px] text-[hsl(var(--muted-foreground)] uppercase tracking-wider mb-2">Affected Endpoints</p>
                        <div className="space-y-1">
                          {alert.affectedEndpoints.map((ep, i) => (
                            <p key={i} className="text-xs text-[hsl(var(--muted-foreground)] font-mono">{ep}</p>
                          ))}
                        </div>
                      </div>
                    )}

                    {alert.sampleLogs?.length > 0 && (
                      <div>
                        <p className="text-[10px] text-[hsl(var(--muted-foreground)] uppercase tracking-wider mb-2">Sample Logs</p>
                        <div className="bg-[hsl(var(--background))] rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                          {alert.sampleLogs.map((log, i) => (
                            <div key={i} className="text-[11px] font-mono">
                              <span className="text-[hsl(var(--muted-foreground)]">{new Date(log.timestamp).toLocaleTimeString()}</span>
                              <span className={`ml-2 ${log.statusCode >= 500 ? 'text-red-500' : log.statusCode >= 400 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                {log.statusCode}
                              </span>
                              <span className="ml-2 text-[hsl(var(--muted-foreground)]">{log.method}</span>
                              <span className="ml-2 text-[hsl(var(--foreground))]">{log.endpoint}</span>
                              {log.error && <p className="ml-2 text-red-500 mt-0.5">{log.error}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
