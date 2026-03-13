import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Files, CheckCircle, Clock, AlertCircle, Upload, Search, MessageSquare, FileText } from 'lucide-react'
import { filesApi } from '../api/files'
import { useAuthStore } from '../store/authStore'

const StatCard = ({ icon: Icon, label, value, color = 'text-primary', sub }) => (
  <div className="bg-card border border-border rounded-xl p-5 flex items-start gap-4">
    <div className={`p-2.5 rounded-lg bg-secondary ${color}`}>
      <Icon size={18} />
    </div>
    <div>
      <p className="text-2xl font-bold">{value ?? '—'}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  </div>
)

const QuickAction = ({ to, icon: Icon, title, desc, color }) => (
  <Link to={to} className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 hover:shadow-md transition-all group">
    <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
      <Icon size={18} className="text-white" />
    </div>
    <p className="font-semibold text-sm">{title}</p>
    <p className="text-xs text-muted-foreground mt-1">{desc}</p>
  </Link>
)

function StatusBadge({ status }) {
  const map = {
    ready: 'bg-green-500/10 text-green-500 border-green-500/20',
    processing: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    pending: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    failed: 'bg-red-500/10 text-red-500 border-red-500/20',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${map[status] || map.pending}`}>
      {status}
    </span>
  )
}

export default function Dashboard() {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const { user, org } = useAuthStore()

  useEffect(() => {
    filesApi.list({ limit: 5 })
      .then(r => setDocs(r.data.data.documents))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const ready = docs.filter(d => d.status === 'ready').length
  const processing = docs.filter(d => d.status === 'processing').length
  const failed = docs.filter(d => d.status === 'failed').length
  const total = docs.length

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Good to see you, {user?.fullName?.split(' ')[0]} 👋</h1>
        <p className="text-muted-foreground mt-1 text-sm">Here's what's happening in your workspace</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={Files} label="Total Documents" value={total} />
        <StatCard icon={CheckCircle} label="Ready" value={ready} color="text-green-500" />
        <StatCard icon={Clock} label="Processing" value={processing} color="text-yellow-500" />
        <StatCard icon={AlertCircle} label="Failed" value={failed} color="text-red-500" />
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <QuickAction to="/documents" icon={Upload} title="Upload Document" desc="PDF, DOCX, or TXT files" color="bg-blue-500" />
          <QuickAction to="/documents" icon={FileText} title="My Documents" desc="Manage & view all files" color="bg-orange-500" />
          <QuickAction to="/search" icon={Search} title="Search Documents" desc="Semantic + full-text search" color="bg-violet-500" />
          <QuickAction to="/chat" icon={MessageSquare} title="Ask AI" desc="RAG-powered Q&A on your docs" color="bg-emerald-500" />
        </div>
      </div>

      {/* Recent documents */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Recent Documents</h2>
          <Link to="/documents" className="text-xs text-primary hover:underline">View all →</Link>
        </div>
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
          ) : docs.length === 0 ? (
            <div className="p-8 text-center">
              <Files size={32} className="mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No documents yet</p>
              <Link to="/documents" className="mt-3 inline-block text-xs text-primary hover:underline">Upload your first document →</Link>
            </div>
          ) : (
            <table className="w-full">
              <thead className="border-b border-border">
                <tr>
                  {['Name', 'Status', 'Words', 'Chunks', 'Uploaded'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {docs.map(doc => (
                  <tr key={doc.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium truncate max-w-48">{doc.original_name}</td>
                    <td className="px-4 py-3"><StatusBadge status={doc.status} /></td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{doc.word_count ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{doc.chunk_count ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(doc.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}