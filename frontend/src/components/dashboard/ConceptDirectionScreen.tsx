"use client";

import { useState } from "react";

interface ArtDirection {
  name: string;
  color_palette: { colors: string[]; reasoning: string };
  visual_treatment: string;
  target_audience: string;
  campaign_tone: string;
  prompt_fragments: { nano_banana: string; veo: string; lyria: string };
}

interface ConceptDirectionScreenProps {
  businessName: string;
  productName: string;
  artDirections: ArtDirection[];
  vibeImages: string[];
  onBack: () => void;
  onGenerate: (conceptIndex: number) => void;
}

export default function ConceptDirectionScreen({
  businessName,
  productName,
  artDirections,
  vibeImages,
  onBack,
  onGenerate,
}: ConceptDirectionScreenProps) {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="flex flex-col rounded-2xl border border-white/[0.1] shadow-2xl overflow-hidden w-[860px] max-h-[90vh]"
        style={{ backgroundColor: "#13161e" }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M19 12H5" /><path d="M12 5l-7 7 7 7" />
            </svg>
            Back
          </button>
        </div>

        {/* Heading */}
        <div className="px-6 pb-5">
          <h1 className="text-2xl font-bold text-white">What story should your product tell?</h1>
          <p className="text-sm text-white/40 mt-1">
            Each direction targets a different audience with a different message. Pick the one that fits your brand.
          </p>
        </div>

        {/* Cards */}
        <div className="flex-1 overflow-y-auto px-6 pb-4">
          <div className="grid grid-cols-3 gap-4">
            {artDirections.map((ad, i) => {
              const isSelected = selected === i;
              const palette = ad.color_palette?.colors || [];

              return (
                <button
                  key={i}
                  onClick={() => setSelected(i)}
                  className={[
                    "flex flex-col rounded-2xl text-left transition-all duration-200 overflow-hidden",
                    isSelected
                      ? "border-2 border-blue-400 bg-white/[0.04]"
                      : "border border-white/[0.07] bg-white/[0.02] hover:border-white/15",
                  ].join(" ")}
                >
                  {/* Scene image with radio dot */}
                  <div className="relative">
                    {vibeImages[i] ? (
                      <img
                        src={vibeImages[i]}
                        alt={ad.name}
                        className="w-full aspect-[4/3] object-cover rounded-t-2xl"
                      />
                    ) : (
                      <div className="w-full aspect-[4/3] rounded-t-2xl flex items-center justify-center bg-white/[0.03]">
                        <span className="text-xs text-white/20">Loading...</span>
                      </div>
                    )}
                    {/* Radio dot */}
                    <div className={[
                      "absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                      isSelected
                        ? "border-blue-400 bg-blue-500 shadow-lg shadow-blue-900/50"
                        : "border-white/40 bg-black/40 backdrop-blur-sm",
                    ].join(" ")}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="px-4 pt-3 pb-4 flex flex-col gap-2">
                    <p className="text-[14px] font-bold text-white">{ad.name}</p>

                    {/* Color palette dots */}
                    <div className="flex items-center gap-1.5">
                      {palette.slice(0, 4).map((hex, j) => (
                        <div
                          key={j}
                          className="w-3 h-3 rounded-full border border-white/10"
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                    </div>

                    <p className="text-[11px] text-white/50 leading-snug">{ad.campaign_tone}</p>
                    <p className="text-[11px] text-white/30 leading-snug line-clamp-1">{ad.target_audience}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Info hint */}
        <div className="mx-6 mb-4 flex items-start gap-2.5 px-4 py-3 rounded-xl bg-blue-500/[0.06] border border-blue-400/10">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400/60 flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <p className="text-xs text-blue-300/50 leading-relaxed">
            Your product will be placed into the selected scene with matching lighting and composition. You'll see the result before the full campaign generates.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-white/[0.05] flex-shrink-0">
          <button
            disabled={selected === null}
            onClick={() => selected !== null && onGenerate(selected)}
            className={[
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
              selected !== null
                ? "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/40"
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
