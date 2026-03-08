import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { FileText, Brain, Users, Database, TrendingUp, Award, Zap, MessageSquare, BookOpen, HelpCircle, Search } from 'lucide-react';
import client from '../api/client';

const FEATURE_CONFIG = {
  summarize:      { label: 'Summarizer',      color: '#3b82f6', icon: BookOpen },
  qa_generator:   { label: 'Q&A Generator',   color: '#8b5cf6', icon: HelpCircle },
  knowledge_chat: { label: 'Knowledge Chat',  color: '#06b6d4', icon: Brain },
  chat:           { label: 'Ask AI',          color: '#10b981', icon: MessageSquare },
  search:         { label: 'Search',          color: '#f59e0b', icon: Search },
};

const PIE_COLORS = ['#3b82f6','#8b5cf6','#06b6d4','#10b981','#f59e0b'];

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0`} style={{ background: `${color}20` }}>
        <Icon size={22} style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm font-medium text-gray-700 dark:text-foreground">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024*1024) return `${(bytes/1024).toFixed(1)} KB`;
  return `${(bytes/(1024*1024)).toFixed(1)} MB`;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-lg">
        <p className="text-xs font-semibold">{label}</p>
        <p className="text-sm font-bold text-violet-500">{payload[0].value} queries</p>
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    client.get('/api/analytics')
      .then(r => setData(r.data.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-muted-foreground text-sm">Loading analytics...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-full">
      <p className="text-red-500">Failed to load analytics: {error}</p>
    </div>
  );

  // Prepare pie chart data
  const pieData = (data.feature_breakdown || []).map((f, i) => ({
    name: FEATURE_CONFIG[f.feature]?.label || f.feature,
    value: parseInt(f.count),
    color: PIE_COLORS[i % PIE_COLORS.length],
  }));

  // Prepare bar chart data
  const barData = (data.daily_queries || []).map(d => ({
    date: new Date(d.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    queries: parseInt(d.count),
  }));

  // Fill missing days with 0
  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    const found = barData.find(b => b.date === label);
    last7.push({ date: label, queries: found?.queries || 0 });
  }

  const totalPieValue = pieData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-violet-500/20 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-violet-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Usage Analytics</h1>
            <p className="text-muted-foreground text-sm">Track your AI usage, documents and feature adoption</p>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={FileText} label="Documents" value={data.total_docs} sub={formatBytes(data.total_storage)} color="#3b82f6" />
        <StatCard icon={Brain} label="AI Queries" value={data.total_queries} sub="total all time" color="#8b5cf6" />
        <StatCard icon={Users} label="Team Members" value={data.total_users} sub="in your org" color="#10b981" />
        <StatCard icon={Database} label="Storage Used" value={formatBytes(data.total_storage)} sub={`${data.total_docs} files`} color="#f59e0b" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pie Chart — Feature Breakdown */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Zap size={18} className="text-violet-500" />
            <h2 className="font-bold">AI Feature Adoption</h2>
          </div>
          {pieData.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              No queries yet. Start using AI features!
            </div>
          ) : (
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                    paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v} queries`, '']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {pieData.map((item, i) => {
                  const pct = totalPieValue > 0 ? Math.round(item.value / totalPieValue * 100) : 0;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: item.color }} />
                      <span className="text-sm flex-1 text-gray-700 dark:text-foreground">{item.name}</span>
                      <span className="text-xs font-bold" style={{ color: item.color }}>{pct}%</span>
                      <span className="text-xs text-muted-foreground w-16 text-right">{item.value} queries</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bar Chart — Daily Queries */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={18} className="text-blue-500" />
            <h2 className="font-bold">Queries — Last 7 Days</h2>
          </div>
          {last7.every(d => d.queries === 0) ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              No queries in the last 7 days yet!
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={last7} barSize={28}>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="queries" fill="#8b5cf6" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Documents */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Award size={18} className="text-yellow-500" />
          <h2 className="font-bold">Most Queried Documents</h2>
        </div>
        {data.top_documents?.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            No document queries yet. Try Summarize or Q&A!
          </div>
        ) : (
          <div className="space-y-3">
            {data.top_documents?.map((doc, i) => {
              const maxCount = data.top_documents[0]?.query_count || 1;
              const pct = Math.round(parseInt(doc.query_count) / maxCount * 100);
              const medals = ['🥇','🥈','🥉'];
              return (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-lg w-6 flex-shrink-0">{medals[i] || `${i+1}.`}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium truncate">{doc.original_name}</p>
                      <span className="text-xs font-bold text-violet-500 ml-2 flex-shrink-0">{doc.query_count} queries</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}