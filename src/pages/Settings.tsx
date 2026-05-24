import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import {
  Settings as SettingsIcon, Sliders, Server, Bell, Database,
  Save, RotateCcw, Loader2,
} from 'lucide-react';
import type { AppConfig } from '@/types';

export default function Settings() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [originalConfig, setOriginalConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data = await api.getConfig();
        setConfig(data);
        setOriginalConfig(data);
      } catch (err) {
        console.error('Failed to fetch config:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      await api.updateConfig(config);
      setOriginalConfig(config);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save config:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (originalConfig) {
      setConfig({ ...originalConfig });
    }
  };

  const hasChanges = config && originalConfig && JSON.stringify(config) !== JSON.stringify(originalConfig);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-[hsl(var(--muted-foreground)]" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center py-12 text-[hsl(var(--muted-foreground)]">
        <p>Failed to load configuration</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[hsl(var(--foreground))] font-semibold text-lg flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-[hsl(var(--muted-foreground)]" />
            Configuration
          </h2>
          <p className="text-xs text-[hsl(var(--muted-foreground)] mt-1">Manage system thresholds and behavior</p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-3 py-2 text-sm text-[hsl(var(--muted-foreground)] hover:text-[hsl(var(--foreground))] transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              saved
                ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                : hasChanges
                ? 'bg-blue-500/20 text-blue-500 border border-blue-500/30 hover:bg-blue-500/30'
                : 'bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground)] border border-[hsl(var(--border))] cursor-not-allowed'
            }`}
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
            ) : saved ? (
              <><SettingsIcon className="w-4 h-4" /> Saved!</>
            ) : (
              <><Save className="w-4 h-4" /> Save Changes</>
            )}
          </button>
        </div>
      </div>

      {/* Alert Thresholds */}
      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-5">
        <h3 className="text-[hsl(var(--foreground))] font-semibold text-sm mb-4 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-amber-500" />
          Alert Thresholds
        </h3>
        <div className="space-y-5">
          {/* Error Rate Threshold */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-[hsl(var(--foreground))]">Error Rate Threshold</label>
              <span className="text-sm text-amber-500 font-mono">{(config.errorRateThreshold * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={config.errorRateThreshold * 100}
              onChange={(e) => setConfig({ ...config, errorRateThreshold: parseInt(e.target.value) / 100 })}
              className="w-full h-2 bg-[hsl(var(--border))] rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <p className="text-xs text-[hsl(var(--muted-foreground)] mt-1">
              Trigger alert when error rate exceeds this percentage
            </p>
          </div>

          {/* Latency Threshold */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-[hsl(var(--foreground))]">Latency Threshold</label>
              <span className="text-sm text-blue-500 font-mono">{config.latencyThreshold}ms</span>
            </div>
            <input
              type="range"
              min="1000"
              max="20000"
              step="500"
              value={config.latencyThreshold}
              onChange={(e) => setConfig({ ...config, latencyThreshold: parseInt(e.target.value) })}
              className="w-full h-2 bg-[hsl(var(--border))] rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <p className="text-xs text-[hsl(var(--muted-foreground)] mt-1">
              Trigger alert when p99 latency exceeds this value
            </p>
          </div>

          {/* Alert Cooldown */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-[hsl(var(--foreground))]">Alert Cooldown</label>
              <span className="text-sm text-purple-500 font-mono">{config.alertCooldown}s</span>
            </div>
            <input
              type="range"
              min="30"
              max="600"
              step="30"
              value={config.alertCooldown}
              onChange={(e) => setConfig({ ...config, alertCooldown: parseInt(e.target.value) })}
              className="w-full h-2 bg-[hsl(var(--border))] rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <p className="text-xs text-[hsl(var(--muted-foreground)] mt-1">
              Minimum time between alerts for the same service
            </p>
          </div>
        </div>
      </div>

      {/* Data Retention */}
      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-5">
        <h3 className="text-[hsl(var(--foreground))] font-semibold text-sm mb-4 flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-500" />
          Data Management
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm text-[hsl(var(--foreground))] block">Log Retention Period</label>
            <p className="text-xs text-[hsl(var(--muted-foreground)]">How long to keep log data in memory</p>
          </div>
          <select
            value={config.retentionHours}
            onChange={(e) => setConfig({ ...config, retentionHours: parseInt(e.target.value) })}
            className="bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:border-[hsl(var(--accent))]"
          >
            <option value={1}>1 Hour</option>
            <option value={6}>6 Hours</option>
            <option value={12}>12 Hours</option>
            <option value={24}>24 Hours</option>
            <option value={48}>48 Hours</option>
          </select>
        </div>
      </div>

      {/* AI Analysis */}
      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-5">
        <h3 className="text-[hsl(var(--foreground))] font-semibold text-sm mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4 text-purple-500" />
          AI Analysis Settings
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm text-[hsl(var(--foreground))] block">Auto-Analyze Critical Alerts</label>
            <p className="text-xs text-[hsl(var(--muted-foreground)]">Automatically trigger AI analysis when critical alerts are detected</p>
          </div>
          <button
            onClick={() => setConfig({ ...config, autoAnalyze: !config.autoAnalyze })}
            className="relative w-12 h-6 rounded-full transition-colors"
            style={{ backgroundColor: config.autoAnalyze ? '#8b5cf6' : 'hsl(var(--border))' }}
          >
            <div
              className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform"
              style={{ transform: config.autoAnalyze ? 'translateX(24px)' : 'translateX(2px)' }}
            />
          </button>
        </div>
      </div>

      {/* System Info */}
      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-5">
        <h3 className="text-[hsl(var(--foreground))] font-semibold text-sm mb-4 flex items-center gap-2">
          <Server className="w-4 h-4 text-emerald-500" />
          System Information
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-[hsl(var(--muted-foreground)]">Version</p>
            <p className="text-sm text-[hsl(var(--foreground))] font-mono">1.0.0</p>
          </div>
          <div>
            <p className="text-xs text-[hsl(var(--muted-foreground)]">Anomaly Detection</p>
            <p className="text-sm text-emerald-500">Active</p>
          </div>
          <div>
            <p className="text-xs text-[hsl(var(--muted-foreground)]">WebSocket Status</p>
            <p className="text-sm text-emerald-500">Connected</p>
          </div>
          <div>
            <p className="text-xs text-[hsl(var(--muted-foreground)]">Data Store</p>
            <p className="text-sm text-[hsl(var(--foreground))]">In-Memory</p>
          </div>
        </div>
      </div>
    </div>
  );
}
