import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, FileText, MessageSquare, Trash2 } from 'lucide-react'
import { searchApi } from '../api/search'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'

function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0
        ${isUser ? 'bg-primary' : 'bg-secondary border border-border'}`}>
        {isUser ? <User size={14} className="text-primary-foreground" /> : <Bot size={14} className="text-muted-foreground" />}
      </div>
      <div className={`max-w-[75%] space-y-2 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed
          ${isUser
            ? 'bg-primary text-primary-foreground rounded-tr-sm'
            : 'bg-card border border-border text-foreground rounded-tl-sm'}`}>
          {isUser ? msg.content : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Sources */}
        {msg.sources && msg.sources.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground px-1">Sources used:</p>
            {msg.sources.map((s, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/50 rounded-lg px-2.5 py-1.5">
                <FileText size={10} /> {s.original_name}
              </div>
            ))}
          </div>
        )}

        {msg.chunks_used !== undefined && (
          <p className="text-xs text-muted-foreground px-1">{msg.chunks_used} context chunks used</p>
        )}
      </div>
    </div>
  )
}

export default function Chat() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm your AI assistant. Ask me anything about your uploaded documents and I'll answer using the relevant content." }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e) => {
    e?.preventDefault()
    const q = input.trim()
    if (!q || loading) return
    if (q.length < 5) return toast.error('Question must be at least 5 characters')

    setInput('')
    setMessages(m => [...m, { role: 'user', content: q }])
    setLoading(true)

    try {
      const { data } = await searchApi.ragQuery(q, { limit: 5 })
      const res = data.data
      setMessages(m => [...m, {
        role: 'assistant',
        content: res.answer,
        sources: res.sources,
        chunks_used: res.chunks_used,
      }])
    } catch (err) {
      const msg = err.response?.data?.message || 'AI is unavailable. Make sure Ollama is running.'
      setMessages(m => [...m, { role: 'assistant', content: `❌ ${msg}` }])
      toast.error(msg)
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const clearChat = () => {
    setMessages([{ role: 'assistant', content: "Chat cleared! Ask me anything about your documents." }])
  }

  const suggestions = [
    "What topics are covered in my documents?",
    "Summarize the key points",
    "What does the document say about AI?",
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <Bot size={16} className="text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold">AI Assistant</p>
            <p className="text-xs text-muted-foreground">Powered by Ollama · RAG search enabled</p>
          </div>
        </div>
        <button onClick={clearChat} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-secondary">
          <Trash2 size={12} /> Clear chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-6 space-y-6">
        {messages.map((msg, i) => <Message key={i} msg={msg} />)}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center">
              <Bot size={14} className="text-muted-foreground" />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Searching documents and generating answer...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length === 1 && (
        <div className="px-6 py-3 flex gap-2 flex-wrap border-t border-border">
          {suggestions.map((s, i) => (
            <button key={i} onClick={() => { setInput(s); inputRef.current?.focus() }}
              className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-primary/50 hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-6 py-4 border-t border-border bg-card/50">
        <form onSubmit={handleSend} className="flex gap-3">
          <div className="relative flex-1">
            <MessageSquare size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask a question about your documents..."
              disabled={loading}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors disabled:opacity-50"
            />
          </div>
          <button type="submit" disabled={loading || !input.trim()}
            className="p-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
            <Send size={16} />
          </button>
        </form>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          AI answers based on your uploaded documents only
        </p>
      </div>
    </div>
  )
}
