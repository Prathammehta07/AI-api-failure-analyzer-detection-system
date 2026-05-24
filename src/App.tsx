import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { wsService } from '@/services/websocket';
import Layout from '@/components/layout/Layout';
import Dashboard from '@/pages/Dashboard';
import Alerts from '@/pages/Alerts';
import Analysis from '@/pages/Analysis';
import Trends from '@/pages/Trends';
import Debug from '@/pages/Debug';
import Logs from '@/pages/Logs';
import Settings from '@/pages/Settings';
import { type ViewType } from '@/types';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');

  useEffect(() => {
    // Connect WebSocket
    wsService.connect();

    // Listen for connection status
    wsService.on('connection', (data) => {
      setConnectionStatus(data.status === 'connected' ? 'connected' : data.status === 'error' ? 'error' : 'disconnected');
    });

    // Health check
    const checkHealth = async () => {
      try {
        await api.healthCheck();
        setConnectionStatus('connected');
      } catch {
        setConnectionStatus('error');
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);

    return () => {
      clearInterval(interval);
      wsService.disconnect();
    };
  }, []);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'alerts': return <Alerts />;
      case 'analysis': return <Analysis />;
      case 'trends': return <Trends />;
      case 'debug': return <Debug />;
      case 'logs': return <Logs />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout
      currentView={currentView}
      onViewChange={setCurrentView}
      connectionStatus={connectionStatus}
    >
      {renderView()}
    </Layout>
  );
}

export default App;
