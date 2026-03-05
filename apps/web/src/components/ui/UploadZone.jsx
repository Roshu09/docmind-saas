import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { useUpload } from "../../hooks/useUpload.js";
import { useQueryClient } from "@tanstack/react-query";

const ACCEPTED = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "text/plain": [".txt"],
};

export default function UploadZone() {
  const qc = useQueryClient();
  const { upload, uploading, progress } = useUpload(() => qc.invalidateQueries({ queryKey: ["documents"] }));

  const onDrop = useCallback((accepted) => {
    accepted.forEach(upload);
  }, [upload]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxSize: 20 * 1024 * 1024,
    disabled: uploading,
  });

  return (
    <div className="space-y-3">
      <div {...getRootProps()}
        className={"border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all " +
          (isDragActive ? "border-accent" : "hover:border-opacity-80")}
        style={{
          borderColor: isDragActive ? "var(--accent)" : "var(--border)",
          background: isDragActive ? "var(--accent-dim)" : "var(--bg-card)",
        }}>
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: "var(--accent-dim)" }}>
            <Upload className="w-5 h-5" style={{ color: "var(--accent)" }} />
          </div>
          <div>
            <p className="font-semibold text-sm">
              {isDragActive ? "Drop files here" : "Drag & drop or click to upload"}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              PDF, DOCX, TXT — max 20MB each
            </p>
          </div>
        </div>
      </div>

      {uploading && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs" style={{ color: "var(--text-secondary)" }}>
            <span>Uploading & queuing for AI processing...</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-hover)" }}>
            <div className="h-full rounded-full transition-all duration-300"
              style={{ width: progress + "%", background: "var(--accent)" }} />
          </div>
        </div>
      )}

      {fileRejections.length > 0 && (
        <div className="flex items-center gap-2 text-xs p-3 rounded-lg"
          style={{ background: "rgba(248,113,113,0.1)", color: "var(--error)" }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {fileRejections[0].errors[0].message}
        </div>
      )}
    </div>
  );
}
