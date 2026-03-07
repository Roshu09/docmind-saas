import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, Zap, ChevronLeft, BookOpen, Target, CheckCircle, Tag, BarChart2, AlertCircle, Loader2, Download } from 'lucide-react';
import { searchApi } from '../api/search';
import RateLimitCountdown from '../components/RateLimitCountdown';
import { exportSummaryPdf } from '../utils/exportPdf';

const DifficultyBadge = ({ level }) => {
  const styles = {
    beginner: 'bg-green-100 text-green-700 border border-green-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30',
    intermediate: 'bg-yellow-100 text-yellow-700 border border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/30',
    advanced: 'bg-red-100 text-red-700 border border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30',
  };
  return <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${styles[level] || styles.intermediate}`}>{level}</span>;
};

const SentimentBadge = ({ sentiment }) => {
  const styles = {
    positive: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
    neutral: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
    negative: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
  };
  const icons = { positive: '😊', neutral: '😐', negative: '😟' };
  return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[sentiment] || styles.neutral}`}>{icons[sentiment]} {sentiment}</span>;
};

export default function Summarize() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [resetAt, setResetAt] = useState(() => localStorage.getItem("groq_reset_at") || null);

  useEffect(() => {
    setSummary(null);
    setError(null);
    handleSummarize();
  }, [documentId]);

  const handleSummarize = async () => {
    setIsGenerating(true);
    setError(null);
    setSummary(null);
    try {
      const res = await searchApi.summarize(documentId);
      setSummary(res.data.data);
    } catch (err) {
      const d = err.response?.data;
      setError(d?.message || err.message || 'Failed to generate summary');
      if (d?.resetAt) { setResetAt(d.resetAt); localStorage.setItem("groq_reset_at", d.resetAt); }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = () => {
    if (!summary) return;
    const content = `# Document Summary\n\n## TL;DR\n${summary.tldr}\n\n## Key Points\n${summary.key_points?.map((p,i) => `${i+1}. ${p}`).join('\n')}\n\n## Action Items\n${summary.action_items?.map(a => `- ${a}`).join('\n')}\n\n## Topics\n${summary.topics?.join(', ')}\n\nDifficulty: ${summary.difficulty} | Sentiment: ${summary.sentiment}`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `summary-${documentId}.md`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <button onClick={() => navigate('/documents')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
        <ChevronLeft size={16} /> Back to Documents
      </button>

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Smart Document Summarizer</h1>
            <p className="text-muted-foreground text-sm">AI-powered summary using Groq Llama 3.3</p>
          </div>
        </div>
      </div>

      {/* Loading */}
      {isGenerating && (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <Loader2 className="w-12 h-12 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-lg font-semibold">Analyzing your document...</p>
          <p className="text-muted-foreground text-sm mt-1">Groq AI is generating your summary</p>
        </div>
      )}

      {/* Error */}
      {error && !isGenerating && (
        <div className="text-center py-16 bg-card border border-border rounded-xl p-6">
          {resetAt
            ? <RateLimitCountdown resetAt={resetAt} onRetry={handleSummarize} />
            : <>
                <div className="flex items-center justify-center gap-2 text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-6 max-w-md mx-auto">
                  <AlertCircle size={16} /><span className="text-sm">{error}</span>
                </div>
                <button onClick={handleSummarize} className="flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all mx-auto">
                  <Zap className="w-5 h-5" />Try Again
                </button>
              </>
          }
        </div>
      )}

      {/* Result */}
      {summary && !isGenerating && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DifficultyBadge level={summary.difficulty} />
              <SentimentBadge sentiment={summary.sentiment} />
            </div>
            <div className="flex gap-3">
              <button onClick={handleSummarize} className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-sm rounded-lg transition-colors">
                <Zap size={14} />Regenerate
              </button>
              <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors">
                <Download size={14} />Export
              </button>
            </div>
          </div>

          {/* TL;DR */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-5 h-5 text-blue-500 dark:text-blue-400" />
              <h3 className="font-bold text-blue-600 dark:text-blue-300 uppercase tracking-wider text-sm">TL;DR</h3>
            </div>
            <p className="text-gray-800 dark:text-foreground text-lg leading-relaxed">{summary.tldr}</p>
          </div>

          {/* Key Points */}
          {summary.key_points?.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-gray-800 dark:text-foreground">Key Points</h3>
              </div>
              <ul className="space-y-3">
                {summary.key_points.map((point, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i+1}</span>
                    <span className="text-gray-700 dark:text-muted-foreground leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Items */}
          {summary.action_items?.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-yellow-500" />
                <h3 className="font-bold text-gray-800 dark:text-foreground">Action Items</h3>
              </div>
              <ul className="space-y-3">
                {summary.action_items.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-1" />
                    <span className="text-gray-700 dark:text-muted-foreground leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Topics */}
            {summary.topics?.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Tag className="w-5 h-5 text-purple-500" />
                  <h3 className="font-bold text-gray-800 dark:text-foreground">Topics</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {summary.topics.map((topic, i) => (
                    <span key={i} className="px-3 py-1 bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 rounded-full text-sm border border-purple-200 dark:border-purple-500/20">{topic}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Analysis */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 className="w-5 h-5 text-orange-500" />
                <h3 className="font-bold text-gray-800 dark:text-foreground">Analysis</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-muted-foreground font-medium">Difficulty</span>
                  <DifficultyBadge level={summary.difficulty} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-muted-foreground font-medium">Sentiment</span>
                  <SentimentBadge sentiment={summary.sentiment} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}