"use client";

export function Input({
  id,
  type = "text",
  placeholder,
  value,
  onChange,
  autoComplete,
  disabled,
  error,
}: {
  id: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  disabled?: boolean;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        disabled={disabled}
        className={[
          "w-full rounded-xl border bg-white/5 px-4 py-3 text-sm text-white",
          "placeholder:text-white/30 outline-none transition-all duration-200",
          "focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          error ? "border-red-400/70" : "border-white/10",
        ].join(" ")}
      />
      {error && <p className="text-xs text-red-400 pl-1">{error}</p>}
    </div>
  );
}
