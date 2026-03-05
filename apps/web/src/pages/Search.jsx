import { useState, useRef } from 'react'
import { Search as SearchIcon, FileText, Loader2, Zap, AlignLeft, Layers } from 'lucide-react'
import { searchApi } from '../api/search'
import toast from 'react-hot-toast'

const TYPE_OPTIONS = [
{ value: 'hybrid', label: 'Hybrid', icon: Layers, desc: 'Semantic + keyword' },
  { value: 'semantic', label: 'Semantic', icon: Zap, desc: 'Meaning-based' },
  { value: 'fulltext', label: 'Keyword', icon: AlignLeft, desc: 'Exact match' },
]

function ResultCard({ result, query }) {
  const highlight = (text, q) => {
    if (!q) return text
    const parts = text.split(new RegExp(`(${q.trim().split(' ').join('|')})`, 'gi'))
    return parts.map((p, i) =>
      p.toLowerCase() === q.toLowerCase()
        ? <mark key={i} className="bg-primary/20 text-primary rounded px-0.5">{p}</mark>
        : p
    )
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <FileText size={14} className="text-muted-foreground shrink-0" />
          <span className="text-sm font-medium text-primary truncate">{result.original_name}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {result.searchType && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground capitalize">{result.searchType}</span>
          )}
          {result.similarity_score !== undefined && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {(result.similarity_score * 100).toFixed(0)}% match
            </span>
          )}
          {result.rrfScore !== undefined && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              score: {result.rrfScore}
            </span>
          )}
        </div>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
        {highlight(result.content, query)}
      </p>
      <p className="text-xs text-muted-foreground mt-3">Chunk #{result.chunk_index + 1}</p>
    </div>
  )
}

export default function Search() {
  const [query, setQuery] = useState('')
  const [searchType, setSearchType] = useState('hybrid')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)

  const handleSearch = async (e) => {
    e?.preventDefault()
    if (!query.trim() || query.trim().length < 2) return toast.error('Enter at least 2 characters')
    setLoading(true)
    try {
      const { data } = await searchApi.search(query, { searchType, limit: 10 })
      setResults(data.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Search failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Search Documents</h1>
        <p className="text-muted-foreground text-sm mt-1">Search across all your documents using AI-powered semantic search</p>
      </div>

      {/* Search form */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="What are you looking for?"
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
            />
          </div>
          <button type="submit" disabled={loading}
            className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2">
            {loading ? <Loader2 size={15} className="animate-spin" /> : <SearchIcon size={15} />}
            Search
          </button>
        </form>

        {/* Search type selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Mode:</span>
          {TYPE_OPTIONS.map(({ value, label, icon: Icon, desc }) => (
            <button key={value} onClick={() => setSearchType(value)}
              title={desc}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${searchType === value ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
              <Icon size={12} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {results && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {results.total} result{results.total !== 1 ? 's' : ''} for <strong className="text-foreground">"{results.query}"</strong>
              <span className="ml-2 text-xs">({results.durationMs}ms)</span>
            </p>
          </div>

          {results.total === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <SearchIcon size={32} className="mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No results found</p>
              <p className="text-xs text-muted-foreground mt-1">Try different keywords or upload more documents</p>
            </div>
          ) : (
            results.results.map((r, i) => (
              <ResultCard key={r.id || i} result={r} query={query} />
            ))
          )}
        </div>
      )}

      {/* Empty state */}
      {!results && !loading && (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <SearchIcon size={40} className="mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-sm font-medium">Search your knowledge base</p>
          <p className="text-xs text-muted-foreground mt-1">Type a query above to search across all your uploaded documents</p>
        </div>
      )}
    </div>
  )
}
