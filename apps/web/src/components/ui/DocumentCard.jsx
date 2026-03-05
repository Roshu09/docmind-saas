import { FileText, File, Trash2, Download, Clock, Hash } from "lucide-react";
import StatusBadge from "./StatusBadge.jsx";
import { getDownloadUrl } from "../../api/files.js";

const ICONS = {
  "application/pdf": { icon: FileText, color: "#f87171" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { icon: File, color: "#60a5fa" },
  "text/plain": { icon: File, color: "#a78bfa" },
};

export default function DocumentCard({ doc, onDelete }) {
  const { icon: Icon, color } = ICONS[doc.mime_type] || ICONS["text/plain"];

  const handleDownload = async () => {
    const { data } = await getDownloadUrl(doc.id);
    window.open(data.data.downloadUrl, "_blank");
  };

  const fmt = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1024 / 1024).toFixed(1) + " MB";
  };

  return (
    <div className="rounded-xl border p-4 flex items-start gap-4 group transition-all hover:border-opacity-70"
      style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: color + "18" }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{doc.original_name}</p>
        <div className="flex flex-wrap items-center gap-3 mt-1.5">
          <StatusBadge status={doc.status} />
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>{fmt(doc.file_size_bytes)}</span>
          {doc.chunk_count && (
            <span className="text-xs flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
              <Hash className="w-3 h-3" />{doc.chunk_count} chunks
            </span>
          )}
          <span className="text-xs flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
            <Clock className="w-3 h-3" />
            {new Date(doc.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {doc.status === "ready" && (
          <button onClick={handleDownload}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
            style={{ background: "var(--bg-hover)", color: "var(--text-secondary)" }}>
            <Download className="w-3.5 h-3.5" />
          </button>
        )}
        <button onClick={() => onDelete(doc.id, doc.original_name)}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
          style={{ background: "rgba(248,113,113,0.15)", color: "var(--error)" }}>
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
