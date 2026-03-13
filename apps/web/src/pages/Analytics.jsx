import { useState, useEffect } from 'react';
import { FileText, Brain, Users, Database, TrendingUp, Award, Zap, BarChart2 } from 'lucide-react';
import client from '../api/client';

const FEATURE_CONFIG = {
  summarize:      { label: 'Summarizer',     color: '#3b82f6' },
  qa_generator:   { label: 'Q&A Generator',  color: '#8b5cf6' },
  knowledge_chat: { label: 'Knowledge Chat', color: '#06b6d4' },
  chat:           { label: 'Ask AI',         color: '#10b981' },
  search:         { label: 'Search',         color: '#f59e0b' },
};

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}20` }}>
        <Icon size={22} style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm font-medium">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

const formatBytes = (bytes) => {
  if (!bytes || bytes < 1024) return `${bytes || 0} B`;
  if (bytes < 1024*1024) return `${(bytes/1024).toFixed(1)} KB`;
  return `${(bytes/(1024*1024)).toFixed(1)} MB`;
};

function CSSBarChart({ data }) {
  const max = Math.max(...data.map(d => d.queries), 1);
  return (
    <div className="flex items-end gap-2 h-40">
      {data.map((d, i) => {
        const pct = Math.round((d.queries / max) * 100);
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
            <span className="text-xs font-bold text-violet-500 opacity-0 group-hover:opacity-100 transition-opacity">{d.queries}</span>
            <div className="w-full rounded-t-lg bg-secondary relative" style={{ height: '100px' }}>
              <div className="absolute bottom-0 w-full bg-violet-500 rounded-t-lg transition-all duration-500" style={{ height: `${pct}%` }} />
            </div>
            <span className="text-xs text-muted-foreground">{d.date}</span>
          </div>
        );
      })}
    </div>
  );
}

function FeatureChart({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <div className="text-center py-8 text-muted-foreground text-sm">No queries yet. Start using AI features!</div>;
  return (
    <div className="space-y-3">
      {data.map((item, i) => {
        const pct = Math.round(item.value / total * 100);
        return (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                <span className="font-medium">{item.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{item.value} queries</span>
                <span className="text-xs font-bold w-8 text-right" style={{ color: item.color }}>{pct}%</span>
              </div>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: item.color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

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
    <div className="flex items-center justify-center py-32">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-muted-foreground text-sm">Loading analytics...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center py-32">
      <p className="text-red-500 text-sm">Failed to load: {error}</p>
    </div>
  );

  const pieData = (data.feature_breakdown || []).map((f, i) => ({
    name: FEATURE_CONFIG[f.feature]?.label || f.feature,
    value: parseInt(f.count),
    color: Object.values(FEATURE_CONFIG)[i % 5]?.color || '#8b5cf6',
  }));

  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    const found = (data.daily_queries || []).find(b =>
      new Date(b.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) === label
    );
    last7.push({ date: label, queries: found ? parseInt(found.count) : 0 });
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={FileText} label="Documents" value={data.total_docs} sub={formatBytes(data.total_storage)} color="#3b82f6" />
        <StatCard icon={Brain} label="AI Queries" value={data.total_queries} sub="total all time" color="#8b5cf6" />
        <StatCard icon={Users} label="Team Members" value={data.total_users} sub="in your org" color="#10b981" />
        <StatCard icon={Database} label="Storage Used" value={formatBytes(data.total_storage)} sub={`${data.total_docs} files`} color="#f59e0b" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Zap size={18} className="text-violet-500" />
            <h2 className="font-bold">AI Feature Adoption</h2>
            <span className="ml-auto text-xs text-muted-foreground">{data.total_queries} total</span>
          </div>
          <FeatureChart data={pieData} />
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={18} className="text-blue-500" />
            <h2 className="font-bold">Queries — Last 7 Days</h2>
          </div>
          <CSSBarChart data={last7} />
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Award size={18} className="text-yellow-500" />
          <h2 className="font-bold">Most Queried Documents</h2>
        </div>
        {!data.top_documents?.length ? (
          <div className="text-center py-6 text-muted-foreground text-sm">No document queries yet. Try Summarize or Q&A!</div>
        ) : (
          <div className="space-y-4">
            {data.top_documents.map((doc, i) => {
              const max = parseInt(data.top_documents[0]?.query_count) || 1;
              const pct = Math.round(parseInt(doc.query_count) / max * 100);
              const medals = ['🥇','🥈','🥉'];
              return (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-lg w-6 flex-shrink-0">{medals[i] || `${i+1}.`}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-sm font-medium truncate">{doc.original_name}</p>
                      <span className="text-xs font-bold text-violet-500 ml-2 flex-shrink-0">{doc.query_count} queries</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-violet-500 rounded-full" style={{ width: `${pct}%` }} />
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
