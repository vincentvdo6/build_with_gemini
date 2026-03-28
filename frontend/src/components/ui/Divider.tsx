export function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-white/10" />
      <span className="text-xs text-white/30 uppercase tracking-widest">{label}</span>
      <div className="h-px flex-1 bg-white/10" />
    </div>
  );
}
