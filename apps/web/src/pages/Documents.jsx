import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, Trash2, Download, RefreshCw, AlertCircle, CheckCircle, Clock, Zap, HelpCircle } from 'lucide-react'
import { filesApi } from '../api/files'
import toast from 'react-hot-toast'

const ALLOWED = { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'], 'text/plain': ['.txt'] }
const LABELS = { 'application/pdf': 'PDF', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX', 'text/plain': 'TXT' }

function StatusBadge({ status }) {
  const cfg = {
    ready: { cls: 'bg-green-500/10 text-green-500 border-green-500/20', icon: CheckCircle },
    processing: { cls: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', icon: Clock },
    pending: { cls: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: Clock },
    failed: { cls: 'bg-red-500/10 text-red-500 border-red-500/20', icon: AlertCircle },
  }
  const { cls, icon: Icon } = cfg[status] || cfg.pending
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      <Icon size={10} /> {status}
    </span>
  )
}

function UploadItem({ file, progress, status, error }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
      <FileText size={16} className="text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{file.name}</p>
        {status === 'uploading' && (
          <div className="mt-1.5 h-1.5 bg-border rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        )}
        {status === 'processing' && <p className="text-xs text-yellow-500 mt-0.5">Queued for AI processing...</p>}
        {status === 'done' && <p className="text-xs text-green-500 mt-0.5">Upload complete ✓</p>}
        {status === 'error' && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
      </div>
      <span className="text-xs text-muted-foreground shrink-0">{(file.size / 1024).toFixed(0)} KB</span>
    </div>
  )
}

export default function Documents() {
  const navigate = useNavigate()
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploads, setUploads] = useState([])
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [deleting, setDeleting] = useState(null)

  const fetchDocs = async () => {
    setLoading(true)
    try {
      const params = { page, limit: 10 }
      if (filterStatus) params.status = filterStatus
      const { data } = await filesApi.list(params)
      setDocs(data.data.documents)
      setPagination(data.data.pagination)
    } catch { toast.error('Failed to load documents') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchDocs() }, [page, filterStatus])

  const onDrop = useCallback(async (acceptedFiles) => {
    for (const file of acceptedFiles) {
      const id = Math.random().toString(36).slice(2)
      setUploads(u => [...u, { id, file, progress: 0, status: 'uploading' }])
      try {
        const { data } = await filesApi.getUploadUrl({ fileName: file.name, mimeType: file.type, fileSize: file.size })
        const { fileId, uploadUrl } = data.data
        await filesApi.uploadToS3(uploadUrl, file, (p) => {
          setUploads(u => u.map(x => x.id === id ? { ...x, progress: p } : x))
        })
        await filesApi.confirm(fileId)
        setUploads(u => u.map(x => x.id === id ? { ...x, status: 'processing', progress: 100 } : x))
        toast.success(`${file.name} uploaded and queued!`)
        setTimeout(() => { setUploads(u => u.filter(x => x.id !== id)); fetchDocs() }, 3000)
      } catch (err) {
        const msg = err.response?.data?.message || err.message || 'Upload failed'
        setUploads(u => u.map(x => x.id === id ? { ...x, status: 'error', error: msg } : x))
        toast.error(msg)
      }
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: ALLOWED, maxSize: 50 * 1024 * 1024 })

  const handleDelete = async (doc) => {
    if (!confirm(`Delete "${doc.original_name}"?`)) return
    setDeleting(doc.id)
    try {
      await filesApi.delete(doc.id)
      toast.success('Document deleted')
      fetchDocs()
    } catch { toast.error('Delete failed') }
    finally { setDeleting(null) }
  }

  const handleDownload = async (doc) => {
    try {
      const { data } = await filesApi.downloadUrl ? filesApi.downloadUrl(doc.id) : filesApi.get(doc.id)
      window.open(data.data?.downloadUrl || '#', '_blank')
    } catch { toast.error('Download failed') }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Documents</h1>
        <p className="text-muted-foreground text-sm mt-1">Upload and manage your AI-processed documents</p>
      </div>

      {/* Upload zone */}
      <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
        ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-secondary/30'}`}>
        <input {...getInputProps()} />
        <Upload size={32} className={`mx-auto mb-3 ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
        <p className="font-medium text-sm">{isDragActive ? 'Drop files here' : 'Drag & drop files here'}</p>
        <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, TXT · Max 50MB per file</p>
        <button type="button" className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          Browse files
        </button>
      </div>

      {/* Upload progress */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Uploading</p>
            <button onClick={() => setUploads([])} className="text-xs text-muted-foreground hover:text-foreground">Clear all</button>
          </div>
          {uploads.map(u => <UploadItem key={u.id} {...u} />)}
        </div>
      )}

      {/* Filters + table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            {['', 'ready', 'processing', 'failed'].map(s => (
              <button key={s} onClick={() => { setFilterStatus(s); setPage(1) }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                  ${filterStatus === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
                {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <button onClick={fetchDocs} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
            <RefreshCw size={14} />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-muted-foreground text-sm">Loading...</div>
        ) : docs.length === 0 ? (
          <div className="p-12 text-center">
            <FileText size={32} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No documents yet</p>
            <p className="text-xs text-muted-foreground mt-1">Upload your first document →</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead className="border-b border-border bg-secondary/20">
                <tr>
                  {['Name', 'Type', 'Status', 'Words', 'Chunks', 'Size', 'AI Tools', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {docs.map(doc => (
                  <tr key={doc.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium max-w-40">
                      <span className="truncate block" title={doc.original_name}>{doc.original_name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                        {LABELS[doc.mime_type] || 'FILE'}
                      </span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={doc.status} /></td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{doc.word_count?.toLocaleString() ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{doc.chunk_count ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{((doc.file_size_bytes || 0) / 1024).toFixed(0)} KB</td>

                    {/* AI Tools column */}
                    <td className="px-4 py-3">
                      {doc.status === 'ready' ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/documents/${doc.id}/summarize`)}
                            title="AI Summarize"
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 text-xs font-semibold transition-colors border border-blue-500/20"
                          >
                            <Zap size={11} />Sum
                          </button>
                          <button
                            onClick={() => navigate(`/documents/${doc.id}/qa`)}
                            title="Generate Q&A"
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-500 text-xs font-semibold transition-colors border border-violet-500/20"
                          >
                            <HelpCircle size={11} />Q&A
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>

                    {/* Actions column: Download + Delete only */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => handleDownload(doc)} title="Download"
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-muted-foreground hover:text-foreground text-xs font-medium border border-border">
                          <Download size={11} />
                        </button>
                        <button onClick={() => handleDelete(doc)} disabled={deleting === doc.id} title="Delete"
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-500 text-xs border border-transparent hover:border-red-500/20">
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  {pagination.total} documents · Page {page} of {pagination.pages}
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="px-3 py-1.5 rounded text-xs bg-secondary disabled:opacity-50 hover:bg-secondary/80">Prev</button>
                  <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}
                    className="px-3 py-1.5 rounded text-xs bg-secondary disabled:opacity-50 hover:bg-secondary/80">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}