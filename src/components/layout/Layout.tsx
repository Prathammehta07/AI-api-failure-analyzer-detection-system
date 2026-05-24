import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { type ViewType } from '@/types';
import type { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  connectionStatus: 'connected' | 'disconnected' | 'error';
}

export default function Layout({ children, currentView, onViewChange, connectionStatus }: LayoutProps) {
  return (
    <div className="flex min-h-screen bg-[hsl(var(--background))]">
      <Sidebar
        currentView={currentView}
        onViewChange={onViewChange}
        connectionStatus={connectionStatus}
      />
      <div className="flex-1 ml-[260px]">
        <TopBar currentView={currentView} />
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
