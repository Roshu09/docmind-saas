import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, FileText } from "lucide-react";
import { ragQuery } from "../../api/search.js";
import ReactMarkdown from "react-markdown";

export default function ChatInterface() {
  const [messages, setMessages] = useState([{
    role: "assistant",
    content: "Hi! I can answer questions about your uploaded documents. What would you like to know?",
    sources: [],
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const question = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: question }]);
    setLoading(true);

    try {
      const { data } = await ragQuery(question, { limit: 5 });
      const { answer, sources } = data.data;
      setMessages(prev => [...prev, { role: "assistant", content: answer, sources }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I encountered an error. Make sure Ollama is running with llama3.2.",
        sources: [],
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={"flex gap-3 " + (msg.role === "user" ? "justify-end" : "")}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: "var(--accent-dim)" }}>
                <Bot className="w-4 h-4" style={{ color: "var(--accent)" }} />
              </div>
            )}
            <div className={"max-w-2xl " + (msg.role === "user" ? "order-first" : "")}>
              <div className={"text-sm px-4 py-3 rounded-2xl " +
                (msg.role === "user"
                  ? "rounded-tr-sm text-white"
                  : "rounded-tl-sm")}
                style={msg.role === "user"
                  ? { background: "var(--accent)" }
                  : { background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                <ReactMarkdown className="prose prose-sm max-w-none dark:prose-invert">
                  {msg.content}
                </ReactMarkdown>
              </div>
              {msg.sources?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {msg.sources.map((s, j) => (
                    <span key={j} className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
                      style={{ background: "var(--bg-hover)", color: "var(--text-muted)" }}>
                      <FileText className="w-3 h-3" />
                      {s.original_name}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: "var(--bg-hover)" }}>
                <User className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "var(--accent-dim)" }}>
              <Bot className="w-4 h-4" style={{ color: "var(--accent)" }} />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm text-sm"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: "var(--text-muted)" }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 border-t" style={{ borderColor: "var(--border)" }}>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Ask a question about your documents..."
            className="flex-1 px-4 py-2.5 rounded-xl text-sm border outline-none"
            style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-primary)" }}
            disabled={loading}
          />
          <button onClick={send} disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-xl flex items-center justify-center disabled:opacity-50 transition-all"
            style={{ background: "var(--accent)", color: "white" }}>
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
