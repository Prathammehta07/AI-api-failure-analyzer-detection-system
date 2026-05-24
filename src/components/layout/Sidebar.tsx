import { useState } from 'react';
import {
  LayoutDashboard,
  Bell,
  BrainCircuit,
  TrendingUp,
  Wrench,
  FileText,
  Settings,
  Server,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { type ViewType } from '@/types';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  connectionStatus: 'connected' | 'disconnected' | 'error';
}

const navItems: { id: ViewType; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'alerts', label: 'Live Alerts', icon: Bell },
  { id: 'analysis', label: 'AI Analysis', icon: BrainCircuit },
  { id: 'trends', label: 'Trends & Charts', icon: TrendingUp },
  { id: 'debug', label: 'Debug Guide', icon: Wrench },
  { id: 'logs', label: 'Log Explorer', icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ currentView, onViewChange, connectionStatus }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-[hsl(var(--sidebar-background))] border-r border-[hsl(var(--sidebar-border))] z-50 transition-all duration-300 ${
        collapsed ? 'w-[68px]' : 'w-[260px]'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-[hsl(var(--sidebar-border))]">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
          <Server className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-[hsl(var(--sidebar-foreground))] font-semibold text-sm whitespace-nowrap">API Failure Analyzer</h1>
            <p className="text-[hsl(var(--sidebar-foreground))] text-[10px] uppercase tracking-wider whitespace-nowrap">Root Cause Detection</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-foreground))] border border-[hsl(var(--sidebar-border))]'
                  : 'text-[hsl(var(--sidebar-foreground))] hover:text-[hsl(var(--sidebar-primary))] hover:bg-[hsl(var(--sidebar-accent))]/50'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-[hsl(var(--sidebar-primary))]' : 'text-[hsl(var(--sidebar-foreground))] group-hover:text-[hsl(var(--sidebar-primary))]'}`} />
              {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
              {isActive && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-red-400" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Connection Status */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[hsl(var(--sidebar-border))]">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected'
                ? 'bg-emerald-500'
                : connectionStatus === 'error'
                ? 'bg-red-500'
                : 'bg-amber-500'
            }`}
          />
          {!collapsed && (
            <span className="text-[11px] text-[hsl(var(--sidebar-foreground))] uppercase tracking-wider">
              {connectionStatus === 'connected' ? 'Live' : connectionStatus === 'error' ? 'Error' : 'Offline'}
            </span>
          )}
        </div>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-[hsl(var(--sidebar-accent))] border border-[hsl(var(--sidebar-border))] rounded-full flex items-center justify-center text-[hsl(var(--sidebar-foreground))] hover:text-[hsl(var(--sidebar-primary))] transition-colors"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}
