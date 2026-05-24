import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import {
  Wrench, Copy, CheckCircle, ChevronRight, Terminal,
  AlertTriangle, Zap, Clock, ArrowRight, Loader2,
} from 'lucide-react';
import type { AIAnalysis, DebugGuide } from '@/types';

function CommandBlock({ command, expectedOutput }: { command: string; expectedOutput: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[hsl(var(--background))] rounded-lg border border-[hsl(var(--border))] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[hsl(var(--border))]">
        <div className="flex items-center gap-2">
          <Terminal className="w-3 h-3 text-[hsl(var(--muted-foreground))]" />
          <span className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider">Command</span>
        </div>
        <button
          onClick={handleCopy}
          className="text-[10px] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] flex items-center gap-1 transition-colors"
        >
          {copied ? (
            <>
              <CheckCircle className="w-3 h-3 text-emerald-500" /> Copied
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" /> Copy
            </>
          )}
        </button>
      </div>
      <div className="p-3">
        <code className="text-xs font-mono text-emerald-500 block whitespace-pre-wrap break-all">{command}</code>
      </div>
      <div className="px-3 py-2 border-t border-[hsl(var(--border))] bg-[hsl(var(--card))]/50">
        <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
          Expected: <span className="text-[hsl(var(--muted-foreground))]">{expectedOutput}</span>
        </p>
      </div>
    </div>
  );
}

export default function Debug() {
  const [analyses, setAnalyses] = useState<AIAnalysis[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AIAnalysis | null>(null);
  const [debugGuide, setDebugGuide] = useState<DebugGuide | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [guideLoading, setGuideLoading] = useState(false);

  useEffect(() => {
    const fetchAnalyses = async () => {
      try {
        const data = await api.getAnalyses({ limit: 20 });
        setAnalyses(data.analyses);
        if (data.analyses.length > 0) {
          setSelectedAnalysis(data.analyses[0]);
        }
      } catch (err) {
        console.error('Failed to fetch analyses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyses();
  }, []);

  useEffect(() => {
    if (!selectedAnalysis) return;

    const fetchGuide = async () => {
      setGuideLoading(true);
      try {
        const guide = await api.getDebugSteps(selectedAnalysis.alertId);
        setDebugGuide(guide);
        setCompletedSteps(new Set());
      } catch (err) {
        console.error('Failed to fetch debug guide:', err);
      } finally {
        setGuideLoading(false);
      }
    };

    fetchGuide();
  }, [selectedAnalysis]);

  const toggleStep = (order: number) => {
    setCompletedSteps(prev => {
      const next = new Set(prev);
      if (next.has(order)) next.delete(order);
      else next.add(order);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-[hsl(var(--muted-foreground))]" />
      </div>
    );
  }

  if (analyses.length === 0) {
    return (
      <div className="text-center py-16">
        <Wrench className="w-10 h-10 text-[hsl(var(--muted-foreground))] mx-auto mb-3" />
        <p className="text-[hsl(var(--foreground))] font-medium">No debug guides available</p>
        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Run AI analysis on alerts to generate debugging steps</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Analysis Selector */}
      <div className="space-y-3">
        <h3 className="text-[hsl(var(--foreground))] font-semibold text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          Select Alert
        </h3>
        <div className="space-y-2">
          {analyses.map(analysis => (
            <button
              key={analysis.id}
              onClick={() => setSelectedAnalysis(analysis)}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                selectedAnalysis?.id === analysis.id
                  ? 'bg-[hsl(var(--accent))] border-[hsl(var(--border))]'
                  : 'bg-[hsl(var(--card))] border-[hsl(var(--border))] hover:border-[hsl(var(--border))]'
              }`}
            >
              <p className="text-xs text-[hsl(var(--foreground))] font-medium line-clamp-2">{analysis.rootCause}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-[hsl(var(--muted-foreground))]">{analysis.serviceName}</span>
                <span className={`text-[10px] ${analysis.confidence > 0.85 ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {(analysis.confidence * 100).toFixed(0)}% confidence
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Debug Guide */}
      <div className="col-span-2 space-y-4">
        {guideLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-6 h-6 animate-spin text-[hsl(var(--muted-foreground))]" />
          </div>
        ) : debugGuide ? (
          <div className="space-y-4">
            {/* Progress */}
            <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[hsl(var(--foreground))] font-semibold text-sm flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-blue-500" />
                  Debug Progress
                </h3>
                <span className="text-xs text-[hsl(var(--muted-foreground))]">
                  {completedSteps.size} / {debugGuide.steps.length} completed
                </span>
              </div>
              <div className="h-2 bg-[hsl(var(--border))] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
                  style={{ width: `${(completedSteps.size / debugGuide.steps.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-3">
              {debugGuide.steps.map((step) => {
                const isCompleted = completedSteps.has(step.order);
                return (
                  <div
                    key={step.order}
                    className={`bg-[hsl(var(--card))] border rounded-lg p-4 transition-all ${
                      isCompleted ? 'border-emerald-500/30' : 'border-[hsl(var(--border))]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleStep(step.order)}
                        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          isCompleted
                            ? 'bg-emerald-500 border-emerald-500'
                            : 'border-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--foreground))]'
                        }`}
                      >
                        {isCompleted && <CheckCircle className="w-3 h-3 text-white" />}
                      </button>
                      <div className="flex-1">
                        <p className={`text-sm ${isCompleted ? 'text-[hsl(var(--muted-foreground))] line-through' : 'text-[hsl(var(--foreground))]'}`}>
                          {step.description}
                        </p>
                        <div className="mt-3">
                          <CommandBlock command={step.command} expectedOutput={step.expectedOutput} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Remediation Summary */}
            <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-5">
              <h4 className="text-[hsl(var(--foreground))] font-semibold text-sm mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Remediation Summary
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-3 h-3 text-red-500" />
                    <p className="text-[10px] text-red-500 uppercase tracking-wider">Immediate</p>
                  </div>
                  <p className="text-xs text-[hsl(var(--foreground))]">{debugGuide.remediation.immediate}</p>
                </div>
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <ArrowRight className="w-3 h-3 text-amber-500" />
                    <p className="text-[10px] text-amber-500 uppercase tracking-wider">Short Term</p>
                  </div>
                  <p className="text-xs text-[hsl(var(--foreground))]">{debugGuide.remediation.shortTerm}</p>
                </div>
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <ChevronRight className="w-3 h-3 text-blue-500" />
                    <p className="text-[10px] text-blue-500 uppercase tracking-wider">Long Term</p>
                  </div>
                  <p className="text-xs text-[hsl(var(--foreground))]">{debugGuide.remediation.longTerm}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 text-[hsl(var(--muted-foreground))]">
            <p>Select an alert to view debug guide</p>
          </div>
        )}
      </div>
    </div>
  );
}