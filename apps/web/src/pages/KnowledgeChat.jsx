import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpenCheck, Send, X, Loader2, AlertCircle, Trash2,
  FileText, Sparkles, ChevronRight, Database, MessageSquare
} from 'lucide-react';
import { filesApi } from '../api/files';
import { searchApi } from '../api/search';
import toast from 'react-hot-toast';

const MAX_DOCS = 5;

const STARTER_QUESTIONS = [
  'What are the main topics covered across these documents?',
  'Summarize the key points from all selected documents.',
  'What are the most important concepts I should know?',
  'Compare the content across the selected documents.',
  'What action items or conclusions can be drawn from these documents?',
];

function DocChip({ doc, onRemove }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-lg text-xs font-medium text-violet-600 dark:text-violet-400 group">
      <FileText size={11} />
      <span className="max-w-24 truncate" title={doc.original_name}>{doc.original_name}</span>
      <button onClick={() => onRemove(doc.id)}
        className="ml-0.5 hover:text-red-500 transition-colors opacity-60 group-hover:opacity-100">
        <X size={11} />
      </button>
    </div>
  );
}

function SourceBadge({ source }) {
  const score = source.similarity_score;
  const scoreColor = score >= 0.8 ? 'text-green-600 dark:text-green-400' : score >= 0.6 ? 'text-yellow-600 dark:text-yellow-400' : 'text-muted-foreground';
  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-secondary rounded-lg text-xs border border-border">
      <FileText size={10} className="text-violet-500 flex-shrink-0" />
      <span className="font-medium text-gray-700 dark:text-gray-300 max-w-28 truncate" title={source.original_name}>{source.original_name}</span>
      {score != null && (
        <span className={`font-bold ${scoreColor}`}>{score.toFixed(2)}</span>
      )}
    </div>
  );
}

function SystemMessage({ text }) {
  return (
    <div className="flex justify-center my-2">
      <span className="text-xs text-muted-foreground bg-secondary px-3 py-1 rounded-full border border-border italic">{text}</span>
    </div>
  );
}

// Render markdown-like formatting: **bold**, bullet lines, numbered lines
function FormattedText({ text }) {
  if (!text) return null;
  const lines = text.split('\n').filter(l => l.trim() !== '');
  return (
    <div className="space-y-1.5 text-sm leading-relaxed">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        // Numbered list
        if (/^\d+\./.test(trimmed)) {
          const content = trimmed.replace(/^\d+\.\s*/, '');
          const num = trimmed.match(/^(\d+)\./)?.[1];
          return (
            <div key={i} className="flex gap-2.5 items-start">
              <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-600 dark:text-violet-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{num}</span>
              <span dangerouslySetInnerHTML={{ __html: formatInline(content) }} />
            </div>
          );
        }
        // Bullet list
        if (/^[-•*]/.test(trimmed)) {
          const content = trimmed.replace(/^[-•*]\s*/, '');
          return (
            <div key={i} className="flex gap-2.5 items-start">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500 flex-shrink-0 mt-2"></span>
              <span dangerouslySetInnerHTML={{ __html: formatInline(content) }} />
            </div>
          );
        }
        // Heading (##)
        if (/^##\s/.test(trimmed)) {
          return <p key={i} className="font-bold text-gray-900 dark:text-white mt-2" dangerouslySetInnerHTML={{ __html: formatInline(trimmed.replace(/^##\s/, '')) }} />;
        }
        // Regular paragraph
        return <p key={i} dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }} />;
      })}
    </div>
  );
}

function formatInline(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

function ChatMessage({ msg, onFollowup }) {
  if (msg.type === 'system') return <SystemMessage text={msg.text} />;
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1
        ${isUser ? 'bg-violet-600 text-white' : 'bg-primary text-primary-foreground'}`}>
        {isUser ? 'U' : 'AI'}
      </div>
      <div className={`max-w-[80%] space-y-2 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`px-4 py-3 rounded-2xl
          ${isUser
            ? 'bg-violet-600 text-white text-sm rounded-tr-sm'
            : 'bg-card border border-border text-gray-800 dark:text-foreground rounded-tl-sm'}`}>
          {isUser ? <p className="text-sm">{msg.text}</p> : <FormattedText text={msg.text} />}
        </div>

        {/* Context indicator */}
        {msg.chunks_used != null && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Database size={10} />
            <span>Using {msg.docs_count} doc{msg.docs_count !== 1 ? 's' : ''} · {msg.chunks_used} chunks retrieved</span>
          </div>
        )}

        {/* Source badges */}
        {msg.sources?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {msg.sources.map((s, i) => <SourceBadge key={i} source={s} />)}
          </div>
        )}

        {/* Follow-up suggestions */}
        {msg.followups?.length > 0 && (
          <div className="space-y-1.5 w-full">
            <p className="text-xs text-muted-foreground font-medium">Suggested follow-ups:</p>
            {msg.followups.map((q, i) => (
              <button key={i} onClick={() => onFollowup(q)}
                className="flex items-center gap-2 w-full text-left px-3 py-2 bg-secondary hover:bg-secondary/80 rounded-xl text-xs text-gray-700 dark:text-gray-300 border border-border transition-colors group">
                <ChevronRight size={12} className="text-violet-500 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                {q}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function KnowledgeChat() {
  const [allDocs, setAllDocs] = useState([]);
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [docsLoading, setDocsLoading] = useState(true);
  const [chatStarted, setChatStarted] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  // Keep a ref so handleSend always has latest selectedDocs
  const selectedDocsRef = useRef([]);

  useEffect(() => {
    selectedDocsRef.current = selectedDocs;
  }, [selectedDocs]);

  useEffect(() => {
    filesApi.list({ limit: 50 })
      .then(r => setAllDocs(r.data.data.documents.filter(d => d.status === 'ready')))
      .catch(() => toast.error('Failed to load documents'))
      .finally(() => setDocsLoading(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleDoc = (doc) => {
    setSelectedDocs(prev => {
      const exists = prev.find(d => d.id === doc.id);
      if (exists) return prev.filter(d => d.id !== doc.id);
      if (prev.length >= MAX_DOCS) {
        toast.error(`Maximum ${MAX_DOCS} documents allowed`);
        return prev;
      }
      return [...prev, doc];
    });
  };

  const removeDoc = (docId) => {
    const doc = selectedDocs.find(d => d.id === docId);
    setSelectedDocs(prev => prev.filter(d => d.id !== docId));
    if (chatStarted && doc) {
      setMessages(prev => [...prev, {
        type: 'system',
        text: `📄 "${doc.original_name}" removed from conversation`
      }]);
    }
  };

  const generateFollowups = async (answer, docIds) => {
    try {
      const res = await searchApi.multiDocQuery(
        `Based on this answer: "${answer.substring(0, 300)}" — suggest exactly 3 short follow-up questions. Return ONLY a JSON array of 3 strings, no markdown, no explanation.`,
        docIds
      );
      const text = res.data.data?.answer || '[]';
      const match = text.match(/\[[\s\S]*\]/);
      if (match) return JSON.parse(match[0]);
      return null;
    } catch {
      return null;
    }
  };

  const handleSend = async (question) => {
    const q = (question || input).trim();
    // Use ref to always get current selected docs
    const currentDocs = selectedDocsRef.current;
    if (!q || isLoading || currentDocs.length === 0) return;

    setInput('');
    if (!chatStarted) setChatStarted(true);

    const userMsg = { role: 'user', text: q, id: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    // Capture docIds at time of sending
    const docIds = currentDocs.map(d => d.id);
    const docCount = currentDocs.length;

    try {
      const res = await searchApi.multiDocQuery(q, docIds);
      const { answer, sources, chunks_used } = res.data.data;

      // Only show sources that are in current selected docs
      const validSources = (sources || []).filter(s => docIds.includes(s.document_id));

      const followups = await generateFollowups(answer, docIds);

      const aiMsg = {
        role: 'assistant',
        text: answer,
        sources: validSources,
        chunks_used,
        docs_count: docCount,
        followups,
        id: Date.now() + 1,
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || '';
      const isRateLimit = errMsg.toLowerCase().includes('rate limit') || errMsg.toLowerCase().includes('token');
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: isRateLimit
          ? '⏳ Daily AI limit reached. Please wait ~40 mins and try again. (Groq free tier: 100k tokens/day)'
          : '❌ Something went wrong. Please try again.',
        sources: [],
        id: Date.now() + 1,
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleClearChat = () => {
    if (!confirm('Clear chat history?')) return;
    setMessages([]);
    setChatStarted(false);
  };

  const canChat = selectedDocs.length > 0;

  return (
    <div className="flex flex-col h-full max-h-screen">

      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-card flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-violet-500/20 rounded-xl flex items-center justify-center">
            <BookOpenCheck className="w-5 h-5 text-violet-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Knowledge Chat</h1>
            <p className="text-xs text-muted-foreground">Chat across multiple documents with AI</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={handleClearChat}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors border border-border">
            <Trash2 size={12} />Clear Chat
          </button>
        )}
      </div>

      {/* Pinned active docs bar */}
      {selectedDocs.length > 0 && (
        <div className="px-6 py-2.5 border-b border-border bg-secondary/30 flex items-center gap-2 flex-wrap flex-shrink-0">
          <span className="text-xs font-medium text-muted-foreground">Active:</span>
          {selectedDocs.map(doc => (
            <DocChip key={doc.id} doc={doc} onRemove={removeDoc} />
          ))}
          {selectedDocs.length >= MAX_DOCS && (
            <span className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1 ml-1">
              <AlertCircle size={11} />Max {MAX_DOCS} docs
            </span>
          )}
        </div>
      )}

      <div className="flex flex-1 min-h-0">

        {/* Left panel */}
        <div className="w-64 flex-shrink-0 border-r border-border bg-card flex flex-col">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Select Documents</p>
            <p className="text-xs text-muted-foreground mt-0.5">{selectedDocs.length}/{MAX_DOCS} selected</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {docsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={16} className="animate-spin text-muted-foreground" />
              </div>
            ) : allDocs.length === 0 ? (
              <div className="text-center py-8">
                <FileText size={24} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">No ready documents</p>
              </div>
            ) : (
              allDocs.map(doc => {
                const isSelected = !!selectedDocs.find(d => d.id === doc.id);
                const isDisabled = !isSelected && selectedDocs.length >= MAX_DOCS;
                return (
                  <button key={doc.id} onClick={() => toggleDoc(doc)} disabled={isDisabled}
                    className={`w-full flex items-start gap-2.5 p-2.5 rounded-xl text-left transition-all border ${
                      isSelected
                        ? 'bg-violet-500/10 border-violet-500/30 text-violet-600 dark:text-violet-400'
                        : isDisabled
                        ? 'opacity-40 cursor-not-allowed border-transparent'
                        : 'hover:bg-secondary border-transparent hover:border-border text-muted-foreground hover:text-foreground'
                    }`}>
                    <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5 border-2 transition-colors ${
                      isSelected ? 'bg-violet-600 border-violet-600' : 'border-border'
                    }`}>
                      {isSelected && <span className="text-white text-xs leading-none">✓</span>}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{doc.original_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{doc.chunk_count} chunks · {((doc.file_size_bytes || 0)/1024).toFixed(0)} KB</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right panel — chat */}
        <div className="flex-1 flex flex-col min-w-0">

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
            {!chatStarted && (
              <div className="space-y-6 py-4">
                <div className="text-center">
                  <div className="w-14 h-14 bg-violet-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-7 h-7 text-violet-500" />
                  </div>
                  <h2 className="text-lg font-bold mb-1">
                    {canChat ? 'Ready to chat!' : 'Select documents to begin'}
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {canChat
                      ? `${selectedDocs.length} document${selectedDocs.length > 1 ? 's' : ''} selected. Ask anything!`
                      : 'Choose up to 5 documents from the left panel'}
                  </p>
                </div>
                {canChat && (
                  <div className="max-w-lg mx-auto space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center mb-3">Suggested Questions</p>
                    {STARTER_QUESTIONS.map((q, i) => (
                      <button key={i} onClick={() => handleSend(q)}
                        className="flex items-center gap-3 w-full text-left px-4 py-3 bg-card hover:bg-secondary border border-border rounded-xl text-sm text-gray-700 dark:text-gray-300 transition-colors group">
                        <MessageSquare size={14} className="text-violet-500 flex-shrink-0" />
                        {q}
                        <ChevronRight size={14} className="ml-auto text-muted-foreground group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {messages.map((msg, i) => (
              <ChatMessage key={msg.id || i} msg={msg} onFollowup={handleSend} />
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground flex-shrink-0 mt-1">AI</div>
                <div className="px-4 py-3 bg-card border border-border rounded-2xl rounded-tl-sm">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Loader2 size={14} className="animate-spin" />
                    <span>Searching {selectedDocsRef.current.length} document{selectedDocsRef.current.length !== 1 ? 's' : ''}...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-6 py-4 border-t border-border bg-card flex-shrink-0">
            {!canChat && (
              <p className="text-center text-xs text-muted-foreground mb-3">← Select at least one document to start chatting</p>
            )}
            <div className={`flex gap-3 items-end transition-opacity ${!canChat ? 'opacity-50 pointer-events-none' : ''}`}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={canChat ? `Ask anything across ${selectedDocs.length} document${selectedDocs.length > 1 ? 's' : ''}...` : 'Select documents first...'}
                rows={1}
                disabled={!canChat || isLoading}
                className="flex-1 resize-none bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 disabled:opacity-50 max-h-32"
                style={{ minHeight: '44px' }}
              />
              <button onClick={() => handleSend()} disabled={!input.trim() || isLoading || !canChat}
                className="w-11 h-11 flex items-center justify-center bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-colors flex-shrink-0">
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">Enter to send · Shift+Enter for new line</p>
          </div>
        </div>
      </div>
    </div>
  );
}