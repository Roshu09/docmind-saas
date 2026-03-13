import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GitCompare, FileText, Loader2, AlertCircle, ChevronLeft,
  CheckCircle, XCircle, Lightbulb, ArrowLeftRight, Sparkles
} from 'lucide-react';
import { filesApi } from '../api/files';
import { searchApi } from '../api/search';
import toast from 'react-hot-toast';

function DocSelector({ docs, selected, onToggle, label, color }) {
  return (
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wider mb-2 px-1" style={{ color }}>
        {label}
      </p>
      <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
        {docs.map(doc => {
          const isSelected = selected?.id === doc.id;
          return (
            <button key={doc.id} onClick={() => onToggle(doc)}
              className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-left transition-all border text-sm ${
                isSelected
                  ? 'border-2 bg-opacity-10'
                  : 'border-border hover:bg-secondary'
              }`}
              style={isSelected ? { borderColor: color, backgroundColor: `${color}15` } : {}}>
              <div className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0"
                style={isSelected ? { borderColor: color, backgroundColor: color } : { borderColor: '#888' }}>
                {isSelected && <span className="text-white text-xs leading-none">✓</span>}
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate text-xs">{doc.original_name}</p>
                <p className="text-xs text-muted-foreground">{doc.chunk_count} chunks</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SummaryCard({ name, summary, color }) {
  return (
    <div className="flex-1 bg-card border-2 rounded-2xl p-5" style={{ borderColor: `${color}40` }}>
      <div className="flex items-center gap-2 mb-3">
        <FileText size={16} style={{ color }} />
        <p className="font-bold text-sm truncate" style={{ color }}>{name}</p>
      </div>
      <p className="text-sm text-gray-700 dark:text-muted-foreground leading-relaxed">{summary}</p>
    </div>
  );
}

export default function Compare() {
  const navigate = useNavigate();
  const [docs, setDocs] = useState([]);
  const [docA, setDocA] = useState(null);
  const [docB, setDocB] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [docsLoading, setDocsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    filesApi.list({ limit: 50 })
      .then(r => setDocs(r.data.data.documents.filter(d => d.status === 'ready')))
      .catch(() => toast.error('Failed to load documents'))
      .finally(() => setDocsLoading(false));
  }, []);

  const handleCompare = async () => {
    if (!docA || !docB) return toast.error('Select 2 documents first');
    if (docA.id === docB.id) return toast.error('Select 2 different documents');
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await searchApi.compareDocuments(docA.id, docB.id);
      setResult(res.data.data);
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setError(msg.includes('rate') || msg.includes('Rate')
        ? '⏳ Daily AI limit reached. Please wait and try again.'
        : msg);
    } finally {
      setLoading(false);
    }
  };

  const COLOR_A = '#3b82f6';
  const COLOR_B = '#8b5cf6';

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <button onClick={() => navigate('/documents')}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
        <ChevronLeft size={16} /> Back to Documents
      </button>

      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
            <GitCompare className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Document Comparison</h1>
            <p className="text-muted-foreground text-sm">AI-powered side-by-side analysis of any 2 documents</p>
          </div>
        </div>
      </div>

      {/* Document Selectors */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <p className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">Select 2 Documents to Compare</p>
        {docsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex gap-6">
            <DocSelector docs={docs} selected={docA} onToggle={d => setDocA(prev => prev?.id === d.id ? null : d)}
              label="Document A" color={COLOR_A} />
            <div className="flex items-center flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <ArrowLeftRight size={14} className="text-muted-foreground" />
              </div>
            </div>
            <DocSelector docs={docs} selected={docB} onToggle={d => setDocB(prev => prev?.id === d.id ? null : d)}
              label="Document B" color={COLOR_B} />
          </div>
        )}

        {/* Compare Button */}
        <div className="mt-5 flex items-center gap-4">
          <button onClick={handleCompare}
            disabled={!docA || !docB || loading || docA?.id === docB?.id}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <GitCompare size={16} />}
            {loading ? 'Analyzing...' : 'Compare Documents'}
          </button>
          {docA && docB && docA.id !== docB.id && (
            <p className="text-sm text-muted-foreground">
              Comparing <span className="font-medium" style={{ color: COLOR_A }}>{docA.original_name}</span>
              {' '}vs{' '}
              <span className="font-medium" style={{ color: COLOR_B }}>{docB.original_name}</span>
            </p>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-16 bg-card border border-border rounded-2xl">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-lg font-semibold">Analyzing both documents...</p>
          <p className="text-muted-foreground text-sm mt-1">Groq AI is comparing content, finding similarities & differences</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="flex items-center gap-2 text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <AlertCircle size={16} /><span className="text-sm">{error}</span>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-5">
          {/* Summaries */}
          <div className="flex gap-4">
            <SummaryCard name={result.doc_a_name} summary={result.doc_a_summary} color={COLOR_A} />
            <SummaryCard name={result.doc_b_name} summary={result.doc_b_summary} color={COLOR_B} />
          </div>

          {/* Similarities */}
          {result.similarities?.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle size={18} className="text-emerald-500" />
                <h3 className="font-bold text-gray-800 dark:text-foreground">Similarities</h3>
                <span className="ml-auto text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-full border border-emerald-500/20">
                  {result.similarities.length} found
                </span>
              </div>
              <ul className="space-y-2.5">
                {result.similarities.map((s, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-emerald-500 text-xs font-bold">{i+1}</span>
                    </div>
                    <span className="text-sm text-gray-700 dark:text-muted-foreground leading-relaxed">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Differences */}
          {result.differences?.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <XCircle size={18} className="text-red-500" />
                <h3 className="font-bold text-gray-800 dark:text-foreground">Differences</h3>
                <span className="ml-auto text-xs bg-red-500/10 text-red-600 dark:text-red-400 px-2 py-1 rounded-full border border-red-500/20">
                  {result.differences.length} aspects
                </span>
              </div>
              <div className="space-y-3">
                {result.differences.map((d, i) => (
                  <div key={i} className="border border-border rounded-xl overflow-hidden">
                    <div className="px-4 py-2 bg-secondary border-b border-border">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{d.aspect}</p>
                    </div>
                    <div className="grid grid-cols-2">
                      <div className="p-4 border-r border-border">
                        <p className="text-xs font-semibold mb-1.5 truncate" style={{ color: COLOR_A }}>{result.doc_a_name}</p>
                        <p className="text-sm text-gray-700 dark:text-muted-foreground leading-relaxed">{d.doc_a}</p>
                      </div>
                      <div className="p-4">
                        <p className="text-xs font-semibold mb-1.5 truncate" style={{ color: COLOR_B }}>{result.doc_b_name}</p>
                        <p className="text-sm text-gray-700 dark:text-muted-foreground leading-relaxed">{d.doc_b}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Insights */}
          {result.insights?.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb size={18} className="text-amber-500" />
                <h3 className="font-bold text-gray-800 dark:text-foreground">Key Insights</h3>
              </div>
              <ul className="space-y-2.5">
                {result.insights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Sparkles size={14} className="text-amber-500 flex-shrink-0 mt-1" />
                    <span className="text-sm text-gray-700 dark:text-foreground leading-relaxed">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendation */}
          {result.recommendation && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <GitCompare size={18} className="text-blue-500" />
                <h3 className="font-bold text-blue-600 dark:text-blue-300">Conclusion</h3>
              </div>
              <p className="text-gray-800 dark:text-foreground leading-relaxed">{result.recommendation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}