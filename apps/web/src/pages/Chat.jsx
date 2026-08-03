import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, FileText, MessageSquare, Trash2, Plus, Clock, History } from 'lucide-react'
import { searchApi, streamRagQuery } from '../api/search'
import { chatApi } from '../api/chat'
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
              <ReactMarkdown>{msg.content || '...'}</ReactMarkdown>
            </div>
          )}
        </div>
        {msg.sources && msg.sources.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground px-1">Sources:</p>
            {msg.sources.map((s, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/50 rounded-lg px-2.5 py-1.5">
                <FileText size={10} /> {s.original_name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Chat() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm your AI assistant. Ask me anything about your uploaded documents." }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessions, setSessions] = useState([])
  const [currentSessionId, setCurrentSessionId] = useState(null)
  const [showHistory, setShowHistory] = useState(true)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => { loadSessions() }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const loadSessions = async () => {
    try {
      const res = await chatApi.getSessions('chat')
      setSessions(res.data.data || [])
    } catch {}
  }

  const loadSession = async (sessionId) => {
    try {
      const res = await chatApi.getMessages(sessionId)
      const msgs = res.data.data || []
      setMessages(msgs.map(m => ({
        role: m.role,
        content: m.content,
        sources: m.sources || [],
        chunks_used: m.chunks_used
      })))
      setCurrentSessionId(sessionId)
    } catch {
      toast.error('Failed to load chat history')
    }
  }

  const startNewChat = () => {
    setMessages([{ role: 'assistant', content: "Hi! I'm your AI assistant. Ask me anything about your uploaded documents." }])
    setCurrentSessionId(null)
    inputRef.current?.focus()
  }

  const deleteSession = async (e, sessionId) => {
    e.stopPropagation()
    try {
      await chatApi.deleteSession(sessionId)
      setSessions(s => s.filter(s => s.id !== sessionId))
      if (currentSessionId === sessionId) startNewChat()
      toast.success('Chat deleted')
    } catch {
      toast.error('Failed to delete chat')
    }
  }

  const handleSend = async (e) => {
    e?.preventDefault()
    const q = input.trim()
    if (!q || loading) return
    if (q.length < 5) return toast.error('Question must be at least 5 characters')
    setInput('')
    setMessages(m => [...m, { role: 'user', content: q }])
    setLoading(true)
    setMessages(m => [...m, { role: 'assistant', content: '', streaming: true }])

    try {
      // Create session if new chat
      let sessionId = currentSessionId
      if (!sessionId) {
        const res = await chatApi.createSession(q, 'chat')
        sessionId = res.data.data.id
        setCurrentSessionId(sessionId)
        loadSessions()
      }

      // Save user message
      await chatApi.saveMessage(sessionId, 'user', q)

      // Stream response
      const token = (() => { try { const r = localStorage.getItem('aifi-auth'); return r ? JSON.parse(r)?.state?.accessToken : null } catch { return null } })()
      const response = await fetch('/api/rag/query/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ question: q, limit: 5 }),
      })

      if (!response.ok) throw new Error('stream_failed')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let doneData = null
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (!data) continue
          try {
            const chunk = JSON.parse(data)
            if (chunk.type === 'answer') {
              fullContent += chunk.content
              setMessages(m => {
                const msgs = [...m]
                const last = { ...msgs[msgs.length - 1] }
                last.content = fullContent
                msgs[msgs.length - 1] = last
                return msgs
              })
            } else if (chunk.type === 'done') {
              doneData = chunk
            }
          } catch {}
        }
      }

      // Finalize message
      setMessages(m => {
        const msgs = [...m]
        const last = { ...msgs[msgs.length - 1] }
        last.streaming = false
        last.sources = doneData?.sources || []
        last.chunks_used = doneData?.chunks_used
        msgs[msgs.length - 1] = last
        return msgs
      })

      // Save assistant message to DB
      await chatApi.saveMessage(sessionId, 'assistant', fullContent, doneData?.sources || [], doneData?.chunks_used || 0)

    } catch (err) {
      // Fallback to normal API
      try {
        const { data } = await searchApi.ragQuery(q, { limit: 5 })
        const res = data.data
        const fullContent = res.answer

        setMessages(m => {
          const msgs = [...m]
          const last = { ...msgs[msgs.length - 1] }
          last.streaming = false
          last.content = fullContent
          last.sources = res.sources
          last.chunks_used = res.chunks_used
          msgs[msgs.length - 1] = last
          return msgs
        })

        if (currentSessionId) {
          await chatApi.saveMessage(currentSessionId, 'assistant', fullContent, res.sources || [], res.chunks_used || 0)
        }
      } catch (fallbackErr) {
        const msg = '❌ AI is unavailable. Please try again.'
        setMessages(m => {
          const msgs = [...m]
          const last = { ...msgs[msgs.length - 1] }
          last.streaming = false
          last.content = msg
          msgs[msgs.length - 1] = last
          return msgs
        })
        toast.error(msg)
      }
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const formatTime = (dateStr) => {
    const d = new Date(dateStr)
    const now = new Date()
    const diff = now - d
    if (diff < 86400000) return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    if (diff < 604800000) return d.toLocaleDateString('en-IN', { weekday: 'short' })
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
  }

  return (
    <div className="flex h-full">
      {/* History Sidebar */}
      <div className={`${showHistory ? 'w-64' : 'w-0'} flex-shrink-0 border-r border-border bg-card flex flex-col transition-all duration-300 overflow-hidden`}>
        <div className="p-3 border-b border-border">
          <button onClick={startNewChat}
            className="w-full flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus size={15} /> New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <Clock size={20} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">No chat history yet</p>
            </div>
          ) : (
            sessions.map(session => (
              <div key={session.id}
                onClick={() => loadSession(session.id)}
                className={`group flex items-start gap-2 p-2.5 rounded-xl cursor-pointer transition-colors hover:bg-secondary ${currentSessionId === session.id ? 'bg-secondary' : ''}`}>
                <MessageSquare size={13} className="text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate text-foreground">{session.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatTime(session.updated_at)}</p>
                </div>
                <button onClick={(e) => deleteSession(e, session.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all shrink-0">
                  <Trash2 size={11} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border bg-card flex items-center gap-3">
          <button onClick={() => setShowHistory(h => !h)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${showHistory ? 'bg-violet-500/10 border-violet-500/30 text-violet-600' : 'bg-secondary border-border text-muted-foreground hover:text-foreground'}`}>
            <History size={13} />
            <span>History</span>
          </button>
          <Bot size={18} className="text-primary" />
          <h1 className="font-semibold text-sm">AI Chat</h1>
          {currentSessionId && (
            <span className="text-xs text-muted-foreground ml-auto">Session active</span>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => <Message key={i} msg={msg} />)}
          {loading && messages[messages.length - 1]?.streaming !== true && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center shrink-0">
                <Loader2 size={14} className="animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border bg-card">
          <form onSubmit={handleSend} className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder="Ask anything about your documents..."
              rows={1}
              disabled={loading}
              className="flex-1 resize-none bg-secondary border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 max-h-32"
              style={{ minHeight: '44px' }}
            />
            <button type="submit" disabled={loading || !input.trim()}
              className="p-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors shrink-0">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </form>
          <p className="text-xs text-muted-foreground mt-2 text-center">AI answers based on your uploaded documents only</p>
        </div>
      </div>
    </div>
  )
}
