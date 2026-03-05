const STATUS = {
  ready:      { label: 'Ready',      cls: 'bg-green-500/15 text-green-400 border-green-500/30' },
  processing: { label: 'Processing', cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  pending:    { label: 'Pending',    cls: 'bg-gray-500/15 text-gray-400 border-gray-500/30' },
  failed:     { label: 'Failed',     cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
};
export default function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.pending;
  return (
    <span className={"text-xs px-2 py-0.5 rounded-full border font-medium " + s.cls}>
      {status === "processing" && <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-400 mr-1.5 animate-pulse" />}
      {s.label}
    </span>
  );
}
