import { Activity, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { type ViewType } from '@/types';

interface TopBarProps {
  currentView: ViewType;
  liveIndicator?: boolean;
}

const viewTitles: Record<ViewType, string> = {
  dashboard: 'Dashboard Overview',
  alerts: 'Live Alerts',
  analysis: 'AI Root Cause Analysis',
  trends: 'Trends & Analytics',
  debug: 'Debug Guide',
  logs: 'Log Explorer',
  settings: 'Settings',
};

export default function TopBar({ currentView, liveIndicator = true }: TopBarProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/80 backdrop-blur-sm flex items-center justify-between px-8 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <h2 className="text-[hsl(var(--foreground))] font-semibold text-lg">{viewTitles[currentView]}</h2>
        {liveIndicator && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[hsl(var(--sidebar-background))] border border-[hsl(var(--sidebar-border))]">
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-500 animate-ping opacity-75" />
            </div>
            <span className="text-[11px] text-emerald-400 font-medium uppercase tracking-wider">Live</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground)]">
          <Activity className="w-4 h-4" />
          <span className="text-xs">System Healthy</span>
        </div>
        <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground)]">
          <Clock className="w-4 h-4" />
          <span className="text-xs font-mono">
            {currentTime.toLocaleTimeString('en-US', { hour12: false })}
          </span>
        </div>
      </div>
    </header>
  );
}
