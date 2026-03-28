"use client";

import { useState } from "react";

interface Concept {
  id: string;
  name: string;
  quote: string;
  tone: string;
  audience: string;
  feels: { label: string; color: string }[];
}

const CONCEPTS: Concept[] = [
  {
    id: "morning",
    name: "Morning ritual",
    quote: "\"Start every morning with a moment of warmth. Brewed slow, savoured fast.\"",
    tone: "Intimate, nostalgic",
    audience: "25–40, urban, ritual-driven",
    feels: [
      { label: "Nostalgic",    color: "bg-amber-500/20  text-amber-300  border-amber-500/30"  },
      { label: "Comforted",    color: "bg-amber-500/20  text-amber-300  border-amber-500/30"  },
      { label: "At home",      color: "bg-amber-500/20  text-amber-300  border-amber-500/30"  },
      { label: "Slow down",    color: "bg-amber-500/20  text-amber-300  border-amber-500/30"  },
    ],
  },
  {
    id: "night",
    name: "Night shift",
    quote: "\"The city never sleeps. Neither does your grind. Cold brew for the relentless.\"",
    tone: "Edgy, high-energy",
    audience: "20–35, hustle culture",
    feels: [
      { label: "Unstoppable",  color: "bg-blue-500/20   text-blue-300   border-blue-500/30"   },
      { label: "Bold",         color: "bg-blue-500/20   text-blue-300   border-blue-500/30"   },
      { label: "In the moment",color: "bg-blue-500/20   text-blue-300   border-blue-500/30"   },
      { label: "Driven",       color: "bg-blue-500/20   text-blue-300   border-blue-500/30"   },
    ],
  },
  {
    id: "slow",
    name: "Slow pour",
    quote: "\"Nothing artificial. Just pure cold brew, exactly how nature intended.\"",
    tone: "Clean, organic, premium",
    audience: "28–45, wellness-focused",
    feels: [
      { label: "Refreshed",    color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
      { label: "Grounded",     color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
      { label: "In good hands",color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
      { label: "Mindful",      color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
    ],
  },
];

interface ConceptDirectionScreenProps {
  businessName: string;
  productName: string;
  onBack: () => void;
  onGenerate: (conceptId: string) => void;
}

// Image placeholder
function ImagePlaceholder() {
  return (
    <div className="w-full h-44 rounded-xl flex flex-col items-center justify-center gap-2" style={{ background: "rgba(255,255,255,0.03)" }}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/20">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
      <span className="text-xs text-white/20">AI image generating</span>
    </div>
  );
}

export default function ConceptDirectionScreen({ businessName, productName, onBack, onGenerate }: ConceptDirectionScreenProps) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
    <div className="flex flex-col rounded-2xl border border-white/[0.1] shadow-2xl overflow-hidden w-[860px] max-h-[90vh]" style={{ backgroundColor: "#13161e" }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M19 12H5" /><path d="M12 5l-7 7 7 7" />
          </svg>
          Back to upload
        </button>
        <button className="p-1.5 text-white/30 hover:text-white/60 transition-colors">
          <svg width="16" height="16" viewBox="0 0 4 16" fill="currentColor">
            <circle cx="2" cy="2"  r="1.5" />
            <circle cx="2" cy="8"  r="1.5" />
            <circle cx="2" cy="14" r="1.5" />
          </svg>
        </button>
      </div>

      {/* Heading */}
      <div className="px-6 pb-6">
        <h1 className="text-2xl font-bold text-white">Choose your direction</h1>
        <p className="text-sm text-white/40 mt-1">
          3 concepts for {businessName}{productName ? ` · ${productName}` : ""}
        </p>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="grid grid-cols-3 gap-4">
          {CONCEPTS.map((c) => {
            const isSelected = selected === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                className={[
                  "flex flex-col rounded-2xl border text-left transition-all duration-200 overflow-hidden",
                  isSelected
                    ? "border-blue-400/50 bg-white/[0.04]"
                    : "border-white/[0.07] bg-white/[0.02] hover:border-white/15",
                ].join(" ")}
              >
                {/* Image */}
                <div className="p-3 pb-0">
                  <ImagePlaceholder />
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col gap-3 flex-1">
                  <p className="text-base font-bold text-white">{c.name}</p>
                  <p className="text-xs text-white/50 italic leading-relaxed">{c.quote}</p>

                  <div className="w-full h-px bg-white/[0.06]" />

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-1">Tone</p>
                      <p className="text-xs font-medium text-white/70">{c.tone}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-1">Audience</p>
                      <p className="text-xs font-medium text-white/70">{c.audience}</p>
                    </div>
                  </div>

                  <div className="w-full h-px bg-white/[0.06]" />

                  <div>
                    <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-2">Makes people feel</p>
                    <div className="flex flex-wrap gap-1.5">
                      {c.feels.map((f) => (
                        <span key={f.label} className={`text-xs px-2.5 py-1 rounded-full border ${f.color}`}>
                          {f.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Select row */}
                  <div className="mt-auto pt-2 flex items-center justify-between">
                    <span className="text-xs text-white/30">Select</span>
                    <div className={[
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                      isSelected ? "border-blue-400 bg-blue-500" : "border-white/20",
                    ].join(" ")}>
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.05] flex-shrink-0">
        <span className="text-sm text-white/30">
          {selected ? "" : "Select a direction to continue"}
        </span>
        <button
          disabled={!selected}
          onClick={() => selected && onGenerate(selected)}
          className={[
            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
            selected
              ? "bg-white text-gray-900 hover:bg-white/90 shadow-lg"
              : "bg-white/10 text-white/30 cursor-not-allowed",
          ].join(" ")}
        >
          Generate campaign
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" />
          </svg>
        </button>
      </div>
    </div>
    </div>
  );
}
