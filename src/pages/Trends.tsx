import { useState, useEffect } from 'react';
import { api } from '@/services/api';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  TrendingUp, Clock, BarChart3, PieChartIcon, Activity,
} from 'lucide-react';
import type { TrendData } from '@/types';

const TIME_RANGES = [
  { label: '1H', value: 1 },
  { label: '6H', value: 6 },
  { label: '24H', value: 24 },
  { label: '7D', value: 168 },
];

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899'];

export default function Trends() {
  const [trends, setTrends] = useState<TrendData | null>(null);
  const [hours, setHours] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const data = await api.getTrends(hours);
        setTrends(data);
      } catch (err) {
        console.error('Failed to fetch trends:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrends();
    const interval = setInterval(fetchTrends, 10000);
    return () => clearInterval(interval);
  }, [hours]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[hsl(var(--muted-foreground)]">Loading trends...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[hsl(var(--muted-foreground)]" />
          <span className="text-xs text-[hsl(var(--muted-foreground)]">Time Range:</span>
          <div className="flex gap-1">
            {TIME_RANGES.map(range => (
              <button
                key={range.value}
                onClick={() => setHours(range.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  hours === range.value
                    ? 'bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] border border-[hsl(var(--border))]'
                    : 'text-[hsl(var(--muted-foreground)] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]/50'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-4">
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{trends?.summary.totalRequests?.toLocaleString() || 0}</p>
          <p className="text-xs text-[hsl(var(--muted-foreground)]">Total Requests</p>
        </div>
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-4">
          <p className="text-2xl font-bold text-red-500">{trends?.summary.totalErrors?.toLocaleString() || 0}</p>
          <p className="text-xs text-[hsl(var(--muted-foreground)]">Total Errors</p>
        </div>
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-4">
          <p className="text-2xl font-bold text-amber-500">{trends?.summary.avgErrorRate?.toFixed(2) || 0}%</p>
          <p className="text-xs text-[hsl(var(--muted-foreground)]">Avg Error Rate</p>
        </div>
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-4">
          <p className="text-2xl font-bold text-blue-500">{trends?.summary.avgLatency || 0}ms</p>
          <p className="text-xs text-[hsl(var(--muted-foreground)]">Avg Latency</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Error Rate Over Time */}
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-5">
          <h3 className="text-[hsl(var(--foreground))] font-semibold text-sm mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-red-500" />
            Error Rate Over Time
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={trends?.timeSeries || []}>
              <defs>
                <linearGradient id="errRateGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="timestamp" stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={(val) => new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} unit="%" />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '6px', fontSize: '12px' }}
                formatter={(value: number) => [`${value.toFixed(2)}%`, 'Error Rate']}
                labelFormatter={(label) => new Date(label).toLocaleTimeString()}
              />
              <Area type="monotone" dataKey="errorRate" stroke="#ef4444" strokeWidth={2} fill="url(#errRateGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Request Volume */}
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-5">
          <h3 className="text-[hsl(var(--foreground))] font-semibold text-sm mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" />
            Request Volume
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={trends?.timeSeries || []}>
              <defs>
                <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="timestamp" stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={(val) => new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '6px', fontSize: '12px' }}
                formatter={(value: number) => [value.toLocaleString(), 'Requests']}
                labelFormatter={(label) => new Date(label).toLocaleTimeString()}
              />
              <Area type="monotone" dataKey="totalRequests" stroke="#3b82f6" strokeWidth={2} fill="url(#volGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Service Comparison */}
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-5">
          <h3 className="text-[hsl(var(--foreground))] font-semibold text-sm mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-500" />
            Error Rate by Service
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={trends?.serviceComparison || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={10} unit="%" />
              <YAxis dataKey="service" type="category" stroke="hsl(var(--muted-foreground))" fontSize={10} width={100} />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '6px', fontSize: '12px' }}
                formatter={(value: number) => [`${value.toFixed(2)}%`, 'Error Rate']}
              />
              <Bar dataKey="errorRate" radius={[0, 4, 4, 0]}>
                {(trends?.serviceComparison || []).map((entry, index) => (
                  <Cell key={index} fill={entry.errorRate > 5 ? '#ef4444' : entry.errorRate > 1 ? '#f59e0b' : '#10b981'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Error Type Distribution */}
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-5">
          <h3 className="text-[hsl(var(--foreground))] font-semibold text-sm mb-4 flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-purple-500" />
            Error Type Distribution
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={trends?.errorTypes || []}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={4}
                dataKey="count"
                nameKey="type"
              >
                {(trends?.errorTypes || []).map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '6px', fontSize: '12px' }}
              />
              <Legend formatter={(value) => <span className="text-xs text-[hsl(var(--muted-foreground)]">{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Latency Distribution */}
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-5 col-span-2">
          <h3 className="text-[hsl(var(--foreground))] font-semibold text-sm mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            Latency Distribution
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={trends?.latencyBuckets || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="bucket" stroke="hsl(var(--muted-foreground))" fontSize={10} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '6px', fontSize: '12px' }}
                formatter={(value: number) => [value.toLocaleString(), 'Requests']}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {(trends?.latencyBuckets || []).map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
