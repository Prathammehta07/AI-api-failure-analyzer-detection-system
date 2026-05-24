import { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api';
import { wsService } from '@/services/websocket';
import {
  Search, X, Upload, FileText, ChevronLeft, ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { LogEntry } from '@/types';

const STATUS_COLORS: Record<number, string> = {
  200: 'text-emerald-400',
  201: 'text-emerald-400',
  204: 'text-emerald-400',
  400: 'text-amber-400',
  401: 'text-amber-400',
  403: 'text-amber-400',
  404: 'text-amber-400',
  500: 'text-red-400',
  502: 'text-red-400',
  503: 'text-red-400',
  504: 'text-red-400',
};

const METHOD_COLORS: Record<string, string> = {
  GET: 'text-blue-400',
  POST: 'text-emerald-400',
  PUT: 'text-amber-400',
  DELETE: 'text-red-400',
  PATCH: 'text-purple-400',
};

export default function Logs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showIngestPanel, setShowIngestPanel] = useState(false);
  const [ingestText, setIngestText] = useState('');
  const [services, setServices] = useState<string[]>([]);

  const fetchLogs = useCallback(async () => {
    try {
      const data = await api.getLogs({
        page,
        limit: 25,
        search: search || undefined,
        service: serviceFilter || undefined,
        statusCode: statusFilter || undefined,
      });
      setLogs(data.logs);
      setTotal(data.total);
      const uniqueServices = [...new Set(data.logs.map(l => l.service))];
      setServices(prev => [...new Set([...prev, ...uniqueServices])]);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, serviceFilter, statusFilter]);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    wsService.on('log:ingested', fetchLogs);
    return () => {
      clearInterval(interval);
      wsService.off('log:ingested', fetchLogs);
    };
  }, [fetchLogs]);

  const handleIngest = async () => {
    if (!ingestText.trim()) return;
    try {
      const parsed = JSON.parse(ingestText);
      await api.ingestLogs(parsed);
      setIngestText('');
      setShowIngestPanel(false);
      fetchLogs();
    } catch {
      // Try as array
      try {
        const lines = ingestText.trim().split('\n').filter(l => l.trim());
        const logs = lines.map(line => JSON.parse(line));
        await api.ingestLogs(logs.length === 1 ? logs[0] : logs);
        setIngestText('');
        setShowIngestPanel(false);
        fetchLogs();
      } catch (err) {
        alert('Invalid JSON. Please check your input.');
      }
    }
  };

  const handleGenerate = async () => {
    try {
      await api.generateLogs(10);
      fetchLogs();
    } catch (err) {
      console.error('Failed to generate logs:', err);
    }
  };

  const totalPages = Math.ceil(total / 25);

  const activeFilters = [
    serviceFilter && { key: 'service', value: serviceFilter, onRemove: () => setServiceFilter('') },
    statusFilter && { key: 'status', value: statusFilter, onRemove: () => setStatusFilter('') },
    search && { key: 'search', value: search, onRemove: () => setSearch('') },
  ].filter(Boolean);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground)]" />
          <input
            type="text"
            placeholder="Search logs..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg pl-10 pr-4 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground)] focus:outline-none focus:border-[hsl(var(--accent))]"
          />
        </div>
        <select
          value={serviceFilter}
          onChange={(e) => { setServiceFilter(e.target.value); setPage(1); }}
          className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:border-[hsl(var(--accent))]"
        >
          <option value="">All Services</option>
          {services.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:border-[hsl(var(--accent))]"
        >
          <option value="">All Status</option>
          <option value="200">2xx Success</option>
          <option value="400">4xx Client Error</option>
          <option value="500">5xx Server Error</option>
        </select>
        <button
          onClick={handleGenerate}
          className="flex items-center gap-2 px-3 py-2 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
        >
          <RotateCcw className="w-4 h-4" /> Generate
        </button>
        <button
          onClick={() => setShowIngestPanel(!showIngestPanel)}
          className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 text-blue-500 border border-blue-500/30 rounded-lg text-sm hover:bg-blue-500/30 transition-colors"
        >
          <Upload className="w-4 h-4" /> Ingest
        </button>
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-[hsl(var(--muted-foreground)]">Active filters:</span>
          {activeFilters.map((filter, i) => (
            filter && (
              <span key={i} className="flex items-center gap-1 px-2 py-1 bg-[hsl(var(--accent))] border border-[hsl(var(--border))] rounded text-xs text-[hsl(var(--foreground))]">
                {filter.value}
                <button onClick={filter.onRemove} className="hover:text-red-500 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )
          ))}
          <button
            onClick={() => { setSearch(''); setServiceFilter(''); setStatusFilter(''); setPage(1); }}
            className="text-xs text-[hsl(var(--muted-foreground)] hover:text-[hsl(var(--foreground))] transition-colors"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Ingest Panel */}
      {showIngestPanel && (
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] flex items-center gap-2">
              <Upload className="w-4 h-4 text-blue-500" />
              Ingest Logs
            </h3>
            <button onClick={() => setShowIngestPanel(false)} className="text-[hsl(var(--muted-foreground)] hover:text-[hsl(var(--foreground))]">
              <X className="w-4 h-4" />
            </button>
          </div>
          <textarea
            value={ingestText}
            onChange={(e) => setIngestText(e.target.value)}
            placeholder={`Paste JSON log data here...\nExample: {"service": "user-api", "endpoint": "/api/users", "method": "GET", "statusCode": 500, "latency_ms": 8234, "error": "Connection timeout"}`}
            className="w-full h-32 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg p-3 text-xs font-mono text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground)] focus:outline-none focus:border-[hsl(var(--accent))] resize-none"
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={handleIngest}
              disabled={!ingestText.trim()}
              className="px-4 py-2 bg-blue-500/20 text-blue-500 border border-blue-500/30 rounded-lg text-sm hover:bg-blue-500/30 transition-colors disabled:opacity-50"
            >
              Ingest Logs
            </button>
          </div>
        </div>
      )}

      {/* Logs Table */}
      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg overflow-hidden">
        {loading && logs.length === 0 ? (
          <div className="p-8 text-center text-[hsl(var(--muted-foreground)]">Loading logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-8 h-8 text-[hsl(var(--muted-foreground)] mx-auto mb-2" />
            <p className="text-[hsl(var(--foreground))]">No logs found</p>
            <p className="text-xs text-[hsl(var(--muted-foreground)] mt-1">Try adjusting filters or generate sample logs</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[hsl(var(--border))]">
                    <th className="text-left px-4 py-3 text-[10px] text-[hsl(var(--muted-foreground)] uppercase tracking-wider font-medium">Time</th>
                    <th className="text-left px-4 py-3 text-[10px] text-[hsl(var(--muted-foreground)] uppercase tracking-wider font-medium">Service</th>
                    <th className="text-left px-4 py-3 text-[10px] text-[hsl(var(--muted-foreground)] uppercase tracking-wider font-medium">Endpoint</th>
                    <th className="text-left px-4 py-3 text-[10px] text-[hsl(var(--muted-foreground)] uppercase tracking-wider font-medium">Method</th>
                    <th className="text-left px-4 py-3 text-[10px] text-[hsl(var(--muted-foreground)] uppercase tracking-wider font-medium">Status</th>
                    <th className="text-left px-4 py-3 text-[10px] text-[hsl(var(--muted-foreground)] uppercase tracking-wider font-medium">Latency</th>
                    <th className="text-left px-4 py-3 text-[10px] text-[hsl(var(--muted-foreground)] uppercase tracking-wider font-medium">Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[hsl(var(--border))]">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-[hsl(var(--accent))] transition-colors">
                      <td className="px-4 py-3 text-xs text-[hsl(var(--muted-foreground)] font-mono whitespace-nowrap">
                        {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-[hsl(var(--foreground))] bg-[hsl(var(--accent))] px-2 py-0.5 rounded">{log.service}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[hsl(var(--muted-foreground)] font-mono max-w-[200px] truncate">{log.endpoint}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-mono font-medium ${METHOD_COLORS[log.method] || 'text-[hsl(var(--muted-foreground)]'}`}>
                          {log.method}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-mono font-medium ${STATUS_COLORS[log.statusCode] || 'text-[hsl(var(--muted-foreground)]'}`}>
                          {log.statusCode}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[hsl(var(--muted-foreground)] font-mono">
                        {log.latency_ms}ms
                      </td>
                      <td className="px-4 py-3 text-xs text-red-500 max-w-[250px] truncate">
                        {log.error || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-[hsl(var(--border))]">
              <p className="text-xs text-[hsl(var(--muted-foreground)]">
                Showing {(page - 1) * 25 + 1} - {Math.min(page * 25, total)} of {total} logs
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground)] hover:text-[hsl(var(--foreground))] disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-[hsl(var(--muted-foreground)]">{page} / {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground)] hover:text-[hsl(var(--foreground))] disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
