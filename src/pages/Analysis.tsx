import { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api';
import { wsService } from '@/services/websocket';
import {
  BrainCircuit, Loader2, AlertTriangle, RefreshCw,
  Target, ListOrdered, Zap, Server, ChevronDown, ChevronUp,
} from 'lucide-react';
import type { AIAnalysis, Alert } from '@/types';

function ConfidenceRing({ confidence }: { confidence: number }) {
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (confidence * circumference);
  const color = confidence > 0.85 ? '#10b981' : confidence > 0.7 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative w-20 h-20">
      <svg className="transform -rotate-90 w-20 h-20">
        <circle cx="40" cy="40" r="36" stroke="hsl(var(--border))" strokeWidth="6" fill="none" />
        <circle
          cx="40" cy="40" r="36"
          stroke={color}
          strokeWidth="6"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-[hsl(var(--foreground))]">{(confidence * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
}

function AnalysisCard({ analysis, onRefresh }: { analysis: AIAnalysis; onRefresh: (alertId: string) => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-[#12121a] border border-[#2a2a3a] rounded-lg overflow-hidden hover:border-[#3a3a4a] transition-all">
      {/* Header */}
      <div className="p-5 flex items-start gap-4">
        <ConfidenceRing confidence={analysis.confidence} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase ${
              analysis.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
              analysis.severity === 'warning' ? 'bg-amber-500/20 text-amber-400' :
              'bg-blue-500/20 text-blue-400'
            }`}>
              {analysis.severity}
            </span>
            <span className="text-xs text-[#5a5a72]">{analysis.serviceName}</span>
          </div>
          <p className="text-sm text-[#e8e8f0] font-medium mb-1">{analysis.rootCause}</p>
          <p className="text-xs text-[#5a5a72]">
            {analysis.affectedServices.length} service(s) affected
          </p>
        </div>
        <button
          onClick={() => onRefresh(analysis.alertId)}
          className="text-[#5a5a72] hover:text-[#e8e8f0] p-1.5 rounded-lg hover:bg-[#1a1a25] transition-colors"
          title="Re-analyze"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Probable Causes */}
      <div className="px-5 pb-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-xs text-[#5a5a72] hover:text-[#e8e8f0] transition-colors mb-3"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? 'Hide' : 'Show'} Details
        </button>

        {expanded && (
          <div className="space-y-4">
            {/* Probable Causes */}
            <div>
              <h4 className="text-xs text-[#5a5a72] uppercase tracking-wider mb-2 flex items-center gap-2">
                <Target className="w-3 h-3" /> Probable Causes
              </h4>
              <div className="space-y-2">
                {analysis.probableCauses.map((cause, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#e8e8f0]">{cause.cause}</span>
                        <span className="text-[#5a5a72] font-mono">{(cause.likelihood * 100).toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 bg-[#2a2a3a] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                          style={{ width: `${cause.likelihood * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Debugging Steps */}
            <div>
              <h4 className="text-xs text-[#5a5a72] uppercase tracking-wider mb-2 flex items-center gap-2">
                <ListOrdered className="w-3 h-3" /> Debugging Steps
              </h4>
              <div className="space-y-2">
                {analysis.debuggingSteps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3 bg-[#0a0a0f] rounded-lg p-3">
                    <span className="text-xs font-mono text-[#5a5a72] flex-shrink-0 w-5">{i + 1}.</span>
                    <p className="text-xs text-[#e8e8f0]">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Remediation Actions */}
            <div>
              <h4 className="text-xs text-[#5a5a72] uppercase tracking-wider mb-2 flex items-center gap-2">
                <Zap className="w-3 h-3" /> Remediation
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                  <p className="text-[10px] text-red-400 uppercase tracking-wider mb-1">Immediate</p>
                  <p className="text-xs text-[#e8e8f0]">{analysis.remediationActions.immediate}</p>
                </div>
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
                  <p className="text-[10px] text-amber-400 uppercase tracking-wider mb-1">Short Term</p>
                  <p className="text-xs text-[#e8e8f0]">{analysis.remediationActions.shortTerm}</p>
                </div>
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                  <p className="text-[10px] text-blue-400 uppercase tracking-wider mb-1">Long Term</p>
                  <p className="text-xs text-[#e8e8f0]">{analysis.remediationActions.longTerm}</p>
                </div>
              </div>
            </div>

            {/* Patterns */}
            {analysis.patterns.length > 0 && (
              <div>
                <h4 className="text-xs text-[#5a5a72] uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Server className="w-3 h-3" /> Detected Patterns
                </h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.patterns.map((pattern, i) => (
                    <span key={i} className="text-xs bg-[#1a1a25] text-[#8b8ba3] px-3 py-1.5 rounded-lg border border-[#2a2a3a]">
                      {pattern.description}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Analysis() {
  const [analyses, setAnalyses] = useState<AIAnalysis[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [analysesData, alertsData] = await Promise.all([
        api.getAnalyses({ limit: 20 }),
        api.getAlerts({ status: 'active', limit: 20 }),
      ]);
      setAnalyses(analysesData.analyses);
      setAlerts(alertsData.alerts.filter(a => !a.resolved));
    } catch (err) {
      console.error('Failed to fetch analysis data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    wsService.on('analysis:complete', fetchData);
    return () => { wsService.off('analysis:complete', fetchData); };
  }, [fetchData]);

  const handleAnalyze = async (alertId: string) => {
    setAnalyzing(alertId);
    try {
      await api.triggerAnalysis(alertId);
      await fetchData();
    } catch (err) {
      console.error('Failed to trigger analysis:', err);
    } finally {
      setAnalyzing(null);
    }
  };

  // Find alerts without analysis
  const unanalyzedAlerts = alerts.filter(a => !analyses.some(an => an.alertId === a.id));

  return (
    <div className="space-y-6">
      {/* Pending Analysis */}
      {unanalyzedAlerts.length > 0 && (
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-5">
          <h3 className="text-[hsl(var(--foreground))] font-semibold text-sm mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Pending Analysis ({unanalyzedAlerts.length})
          </h3>
          <div className="space-y-2">
            {unanalyzedAlerts.map(alert => (
              <div key={alert.id} className="flex items-center justify-between bg-[hsl(var(--background))] rounded-lg p-3">
                <div className="min-w-0">
                  <p className="text-sm text-[hsl(var(--foreground))] truncate">{alert.title}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground)]">{alert.serviceName}</p>
                </div>
                <button
                  onClick={() => handleAnalyze(alert.id)}
                  disabled={analyzing === alert.id}
                  className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 text-purple-500 rounded-lg text-xs font-medium hover:bg-purple-500/30 transition-colors disabled:opacity-50 flex-shrink-0"
                >
                  {analyzing === alert.id ? (
                    <><Loader2 className="w-3 h-3 animate-spin" /> Analyzing...</>
                  ) : (
                    <><BrainCircuit className="w-3 h-3" /> Analyze</>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analysis Results */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[hsl(var(--foreground))] font-semibold text-sm flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-purple-500" />
            AI Analysis Results ({analyses.length})
          </h3>
          <button
            onClick={() => fetchData()}
            className="text-xs text-[hsl(var(--muted-foreground)] hover:text-[hsl(var(--foreground))] flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-[hsl(var(--muted-foreground)]">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p>Loading analyses...</p>
          </div>
        ) : analyses.length === 0 ? (
          <div className="text-center py-12">
            <BrainCircuit className="w-10 h-10 text-[hsl(var(--muted-foreground)] mx-auto mb-3" />
            <p className="text-[hsl(var(--foreground))] font-medium">No analyses yet</p>
            <p className="text-xs text-[hsl(var(--muted-foreground)] mt-1">Trigger analysis on pending alerts to see AI-generated root causes</p>
          </div>
        ) : (
          <div className="space-y-4">
            {analyses.map(analysis => (
              <AnalysisCard key={analysis.id} analysis={analysis} onRefresh={handleAnalyze} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
