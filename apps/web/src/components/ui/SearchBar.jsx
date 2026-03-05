import { useState } from "react";
import { Search, Loader2 } from "lucide-react";

export default function SearchBar({ onSearch, loading }) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim().length >= 2) onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search your documents semantically..."
        className="w-full pl-11 pr-24 py-3 rounded-xl text-sm border outline-none transition-all"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border)",
          color: "var(--text-primary)",
        }}
        onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
        onBlur={(e) => e.target.style.borderColor = "var(--border)"}
      />
      <button type="submit" disabled={loading || query.trim().length < 2}
        className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
        style={{ background: "var(--accent)", color: "white" }}>
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Search"}
      </button>
    </form>
  );
}
