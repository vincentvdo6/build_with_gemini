"use client";

import { useRef, useState } from "react";

interface NewCampaignModalProps {
  onClose: () => void;
  onGenerate: (data: { businessName: string; productName: string }) => void;
}

const ALL_ANGLES = ["Front", "Side", "Back", "Top down", "Detail / close-up", "Lifestyle", "Logo"];
const INITIAL_ANGLES = ["Front", "Side"];

export default function NewCampaignModal({ onClose, onGenerate }: NewCampaignModalProps) {
  const [businessName, setBusinessName] = useState("");
  const [productName, setProductName] = useState("");
  const [selectedAngles, setSelectedAngles] = useState<string[]>(INITIAL_ANGLES);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function toggleAngle(angle: string) {
    setSelectedAngles((prev) =>
      prev.includes(angle) ? prev.filter((a) => a !== angle) : [...prev, angle]
    );
  }

  function addNextAngle() {
    const next = ALL_ANGLES.find((a) => !selectedAngles.includes(a));
    if (next) setSelectedAngles((prev) => [...prev, next]);
  }

  // Ordered slots: maintain order from ALL_ANGLES
  const orderedSlots = ALL_ANGLES.filter((a) => selectedAngles.includes(a));
  const nextUnselected = ALL_ANGLES.find((a) => !selectedAngles.includes(a));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex flex-col w-[500px] max-h-[90vh] rounded-2xl border border-white/[0.1] shadow-2xl"
        style={{ background: "#13161e" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 flex-shrink-0">
          <span className="text-lg font-bold text-white">New campaign</span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto px-6 pb-6 flex flex-col gap-5 flex-1">
          {/* Business & Product */}
          <div className="flex flex-col gap-3">
            <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest">
              Business &amp; Product
            </p>
            <div className="flex gap-3">
              <div className="flex-1 flex flex-col gap-1.5">
                <label className="text-xs text-white/50">Business name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. AdCraft"
                  className="rounded-xl bg-white/5 border border-white/[0.07] px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-blue-400/50 transition-colors"
                />
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                <label className="text-xs text-white/50">Product name</label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. Cold Brew Blend"
                  className="rounded-xl bg-white/5 border border-white/[0.07] px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-blue-400/50 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Product Images */}
          <div className="flex flex-col gap-3">
            <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest">
              Product Images
            </p>

            {/* Drop zone */}
            <div
              className="rounded-xl border-2 border-dashed border-white/10 bg-white/[0.02] hover:border-white/20 transition-colors flex flex-col items-center justify-center py-8 gap-2 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/30 mb-1">
                <path d="M12 17V7" />
                <path d="M7 12l5-5 5 5" />
                <path d="M5 20h14" />
              </svg>
              <p className="text-sm font-medium text-white/70">Drop product photos here</p>
              <p className="text-xs text-white/30">Upload multiple angles — front, back, side, detail</p>
              <p className="text-xs text-white/20">PNG, JPG, WEBP · up to 20MB each</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
              />
            </div>

            {/* Thumbnail slots row */}
            <div className="flex items-center gap-2 flex-wrap">
              {orderedSlots.map((angle) => (
                <div
                  key={angle}
                  className="relative group w-16 h-16 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center flex-shrink-0"
                >
                  <span className="text-[10px] text-white/30 text-center px-1 leading-tight">{angle}</span>
                  <button
                    onClick={() => toggleAngle(angle)}
                    className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/70 text-white/80 hover:text-white hover:bg-black/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={`Remove ${angle}`}
                  >
                    <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
              {nextUnselected && (
                <button
                  onClick={addNextAngle}
                  className="w-16 h-16 rounded-xl border border-dashed border-white/10 bg-white/[0.02] flex items-center justify-center text-white/30 hover:text-white/60 hover:border-white/20 transition-colors flex-shrink-0 text-xl font-light"
                  aria-label="Add next angle"
                >
                  +
                </button>
              )}
            </div>

            {/* Angle pills */}
            <div className="flex flex-wrap gap-2 mt-1">
              {ALL_ANGLES.map((angle) => {
                const isSelected = selectedAngles.includes(angle);
                return (
                  <button
                    key={angle}
                    onClick={() => toggleAngle(angle)}
                    className={`rounded-full px-3 py-1 text-xs border transition-colors ${
                      isSelected
                        ? "bg-blue-600/40 text-blue-300 border-blue-400/40"
                        : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:text-white/60"
                    }`}
                  >
                    {angle}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-white/[0.05] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onGenerate({ businessName, productName })}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/40"
          >
            Generate
          </button>
        </div>
      </div>
    </div>
  );
}
