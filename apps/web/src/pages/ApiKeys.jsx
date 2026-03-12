import { useState, useEffect } from 'react';
import { Key, Plus, Copy, Trash2, PowerOff, Shield, Clock, Activity, ChevronDown, X, Check } from 'lucide-react';
import client from '../api/client';
import toast from 'react-hot-toast';

const SCOPES = ['search', 'summarize', 'qa', 'chat', 'compare'];

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-500 text-xs font-medium transition-colors">
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copied!' : 'Copy Key'}
    </button>
  );
}

function NewKeyModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [scopes, setScopes] = useState([...SCOPES]);
  const [expiry, setExpiry] = useState('never');
  const [loading, setLoading] = useState(false);

  const toggleScope = (s) => setScopes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const handleCreate = async () => {
    if (!name.trim()) return toast.error('Key name is required');
    if (scopes.length === 0) return toast.error('Select at least one scope');
    setLoading(true);
    try {
      const expiresAt = expiry === 'never' ? null
        : expiry === '30d' ? new Date(Date.now() + 30 * 86400000).toISOString()
        : expiry === '90d' ? new Date(Date.now() + 90 * 86400000).toISOString()
        : new Date(Date.now() + 365 * 86400000).toISOString();
      const res = await client.post('/api/apikeys', { name, scopes, expiresAt });
      onCreate(res.data.data);
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create key');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
              <Key size={16} className="text-white" />
            </div>
            <h2 className="font-bold text-lg">Create API Key</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Key Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Production App, Mobile Client"
              className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition" />
          </div>

          {/* Scopes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Permissions</label>
            <div className="flex flex-wrap gap-2">
              {SCOPES.map(s => (
                <button key={s} onClick={() => toggleScope(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${scopes.includes(s) ? 'bg-violet-500/15 border-violet-500/40 text-violet-500' : 'bg-secondary border-border text-muted-foreground'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Expiry */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Expiration</label>
            <select value={expiry} onChange={e => setExpiry(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30">
              <option value="never">Never expires</option>
              <option value="30d">30 days</option>
              <option value="90d">90 days</option>
              <option value="1y">1 year</option>
            </select>
          </div>

          <button onClick={handleCreate} disabled={loading}
            className="w-full py-2.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)', boxShadow: '0 4px 15px rgba(124,58,237,0.3)' }}>
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Key size={14} /> Generate API Key</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function NewKeyDisplay({ keyData, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="p-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <Check size={16} className="text-emerald-500" />
            </div>
            <h2 className="font-bold text-lg">API Key Created!</h2>
          </div>
          <p className="text-sm text-muted-foreground ml-12">Copy your key now — it won't be shown again.</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="p-4 bg-secondary rounded-xl border border-border">
            <p className="text-xs text-muted-foreground mb-2 font-medium">YOUR API KEY</p>
            <p className="font-mono text-sm break-all text-foreground mb-3">{keyData.rawKey}</p>
            <CopyButton text={keyData.rawKey} />
          </div>
          <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
            <p className="text-xs text-amber-500 font-semibold">⚠️ Security Notice</p>
            <p className="text-xs text-muted-foreground mt-1">Store this key securely. Never commit it to version control or expose it in client-side code.</p>
          </div>
          <div className="p-4 bg-secondary rounded-xl space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">USAGE EXAMPLE</p>
            <pre className="text-xs font-mono text-violet-500 overflow-x-auto">{`curl -X POST https://docmind.space/api/v1/search \\
  -H "Authorization: Bearer ${keyData.rawKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"query": "your search query"}'`}</pre>
          </div>
          <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 font-medium text-sm transition-colors">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ApiKeys() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newKey, setNewKey] = useState(null);

  const fetchKeys = async () => {
    try {
      const res = await client.get('/api/apikeys');
      setKeys(res.data.data);
    } catch { toast.error('Failed to load API keys'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchKeys(); }, []);

  const handleCreate = (keyData) => {
    setNewKey(keyData);
    fetchKeys();
  };

  const handleRevoke = async (id) => {
    if (!confirm('Revoke this API key? Apps using it will stop working.')) return;
    try {
      await client.patch(`/api/apikeys/${id}/revoke`);
      toast.success('API key revoked');
      fetchKeys();
    } catch { toast.error('Failed to revoke key'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Permanently delete this API key?')) return;
    try {
      await client.delete(`/api/apikeys/${id}`);
      toast.success('API key deleted');
      fetchKeys();
    } catch { toast.error('Failed to delete key'); }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {showModal && <NewKeyModal onClose={() => setShowModal(false)} onCreate={handleCreate} />}
      {newKey && <NewKeyDisplay keyData={newKey} onClose={() => setNewKey(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
              <Key size={18} className="text-white" />
            </div>
            API Keys
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Manage API keys to access DocMind programmatically</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)', boxShadow: '0 4px 15px rgba(124,58,237,0.3)' }}>
          <Plus size={16} /> New API Key
        </button>
      </div>

      {/* Usage guide */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Shield size={14} className="text-violet-500" /> Quick Start</h3>
        <pre className="text-xs font-mono text-muted-foreground bg-secondary p-3 rounded-xl overflow-x-auto">{`# Search documents
curl -X POST https://docmind.space/api/v1/search \\
  -H "Authorization: Bearer aifi_live_your_key" \\
  -d '{"query": "machine learning basics"}'

# Summarize a document  
curl -X POST https://docmind.space/api/v1/summarize \\
  -H "Authorization: Bearer aifi_live_your_key" \\
  -d '{"documentId": "your-doc-id"}'`}</pre>
      </div>

      {/* Keys list */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-sm">Your API Keys</h2>
          <span className="text-xs text-muted-foreground">{keys.length} key{keys.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : keys.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Key size={40} className="text-muted-foreground mx-auto opacity-30" />
            <p className="text-muted-foreground font-medium">No API keys yet</p>
            <p className="text-sm text-muted-foreground">Create your first key to access DocMind via API</p>
            <button onClick={() => setShowModal(true)}
              className="mt-2 px-4 py-2 rounded-xl text-white text-sm font-semibold"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
              Create API Key
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {keys.map(key => (
              <div key={key.id} className="px-6 py-4 flex items-center gap-4 hover:bg-secondary/30 transition-colors">
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${key.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{key.name}</span>
                    {!key.is_active && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 font-medium">Revoked</span>}
                    {key.expires_at && new Date(key.expires_at) < new Date() && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-medium">Expired</span>}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                    <span className="font-mono">{key.key_prefix}</span>
                    <span className="flex items-center gap-1"><Activity size={10} /> {key.request_count} requests</span>
                    <span className="flex items-center gap-1"><Clock size={10} /> Created {formatDate(key.created_at)}</span>
                    {key.last_used_at && <span>Last used {formatDate(key.last_used_at)}</span>}
                  </div>
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {key.scopes?.map(s => (
                      <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-500 font-medium">{s}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {key.is_active && (
                    <button onClick={() => handleRevoke(key.id)} title="Revoke"
                      className="p-2 rounded-lg hover:bg-amber-500/10 text-muted-foreground hover:text-amber-500 transition-colors">
                      <PowerOff size={15} />
                    </button>
                  )}
                  <button onClick={() => handleDelete(key.id)} title="Delete"
                    className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}