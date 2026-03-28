"use client";

import { useState } from "react";

interface CampaignEditorProps {
  campaignName: string;
  onBack: () => void;
}

type ActiveTab = "Background" | "Position" | "Text" | "Style" | "Tweaks";
type AspectRatio = "1:1" | "4:5" | "9:16" | "16:9";

const TABS: ActiveTab[] = ["Background", "Position", "Text", "Style", "Tweaks"];

const STUDIOS = [
  { name: "White studio", desc: "Clean minimal",  color: "#ffffff" },
  { name: "Warm cream",   desc: "Soft neutral",   color: "#f5e6c8" },
  { name: "Dark studio",  desc: "Sleek dramatic", color: "#1a1a2e" },
];

const SCENES = [
  { name: "Cafe & coffee",     desc: "Warm wood ambient",  color: "#c17f3a" },
  { name: "Nature & outdoors", desc: "Lush golden hour",   color: "#4a7c3f" },
  { name: "Linen & marble",    desc: "Editorial luxury",   color: "#d4c5b0" },
  { name: "Neon city night",   desc: "Bold electric",      color: "#1e3a8a" },
  { name: "Beach & summer",    desc: "Bright coastal",     color: "#7dd3fc" },
  { name: "Cozy fireplace",    desc: "Winter warm glow",   color: "#c2410c" },
  { name: "Rainy window",      desc: "Moody cinematic",    color: "#64748b" },
];

const PERSONALITIES = [
  { name: "Lifestyle",   desc: "Natural in-use"   },
  { name: "Editorial",   desc: "Magazine fashion" },
  { name: "Minimal",     desc: "Clean spacious"   },
  { name: "Bold & loud", desc: "High contrast"    },
  { name: "Luxury",      desc: "Rich gold tones"  },
  { name: "Playful",     desc: "Fun colourful"    },
];

const SIZES = ["Small", "Medium", "Large", "Full"];
const FONT_STYLES = ["Clean", "Bold", "Serif", "Script"];

const TWEAKS: { label: string; options: string[] }[] = [
  { label: "ADJUSTMENTS", options: ["Brighter","Darker","Warmer","Cooler","More space","Closer crop"] },
  { label: "CAMERA",      options: ["Bokeh","Lens flare","Film grain","Wide angle","Macro","Overhead"] },
  { label: "COLOUR GRADE",options: ["Golden hour","Faded film","High contrast","Desaturated","Vivid pop","Moody dark"] },
  { label: "EFFECTS",     options: ["Soft shadow","Reflection","Steam / mist","Sparkle","Confetti","Floating props"] },
];

const CANVAS_SIZES: Record<AspectRatio, { w: number; h: number }> = {
  "1:1":  { w: 340, h: 340 },
  "4:5":  { w: 272, h: 340 },
  "9:16": { w: 191, h: 340 },
  "16:9": { w: 340, h: 191 },
};

// ─── Icons ────────────────────────────────────────────────────────────────────

function LeftSidebarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="1" y="1" width="14" height="14" rx="2" />
      <line x1="5" y1="1" x2="5" y2="15" />
    </svg>
  );
}

function RightSidebarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="1" y="1" width="14" height="14" rx="2" />
      <line x1="11" y1="1" x2="11" y2="15" />
    </svg>
  );
}

function XIcon({ size = 8 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 4 16" fill="currentColor">
      <circle cx="2" cy="2"  r="1.5" />
      <circle cx="2" cy="8"  r="1.5" />
      <circle cx="2" cy="14" r="1.5" />
    </svg>
  );
}

function DiagonalArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
      <rect x="2" y="5" width="15" height="14" rx="2" />
      <path d="M17 9l5-3v12l-5-3V9z" />
    </svg>
  );
}

function MusicIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

// ─── Widgets ──────────────────────────────────────────────────────────────────

function PlacementGrid({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {Array.from({ length: 9 }, (_, i) => (
        <button
          key={i}
          onClick={() => onChange(i)}
          className={`aspect-square rounded-lg border transition-colors flex items-center justify-center ${
            value === i
              ? "border-blue-400/60 bg-blue-500/20"
              : "border-white/[0.07] bg-white/[0.02] hover:border-white/20"
          }`}
        >
          {i === 4 && <span className="w-1.5 h-1.5 rounded-full bg-white/30 block" />}
        </button>
      ))}
    </div>
  );
}

function PillSelector({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`rounded-full px-3 py-1.5 text-xs border transition-colors ${
            value === opt
              ? "bg-blue-600/40 text-blue-300 border-blue-400/40"
              : "bg-white/5 text-white/40 border-white/10 hover:text-white/60 hover:bg-white/10"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

// ─── Delete overlay for image tiles ──────────────────────────────────────────

function DeletableTile({
  children,
  onDelete,
  className,
  onClick,
}: {
  children: React.ReactNode;
  onDelete: () => void;
  className: string;
  onClick?: () => void;
}) {
  return (
    <div className="relative group aspect-square">
      <button onClick={onClick} className={`w-full h-full ${className}`}>
        {children}
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/70 text-white/80 hover:text-white hover:bg-black/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
        aria-label="Delete"
      >
        <XIcon size={7} />
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CampaignEditor({ campaignName, onBack }: CampaignEditorProps) {
  const [editingName, setEditingName]           = useState(false);
  const [name, setName]                         = useState(campaignName);
  const [leftOpen, setLeftOpen]                 = useState(true);
  const [rightOpen, setRightOpen]               = useState(true);
  const [activeTab, setActiveTab]               = useState<ActiveTab>("Background");
  const [selectedRatio, setSelectedRatio]       = useState<AspectRatio>("1:1");
  const [selectedStudio, setSelectedStudio]     = useState("White studio");
  const [selectedScene, setSelectedScene]       = useState<string | null>(null);
  const [selectedPersonality, setSelectedPersonality] = useState("Lifestyle");
  const [selectedSize, setSelectedSize]         = useState("Medium");
  const [selectedFontStyle, setSelectedFontStyle] = useState("Clean");
  const [placement, setPlacement]               = useState(4);
  const [textPlacement, setTextPlacement]       = useState(4);
  const [depthValue, setDepthValue]             = useState(30);
  const [lightingValue, setLightingValue]       = useState(30);
  const [showBrandName, setShowBrandName]       = useState(false);
  const [showTagline, setShowTagline]           = useState(false);
  const [showPriceCTA, setShowPriceCTA]         = useState(false);
  const [selectedGenerated, setSelectedGenerated] = useState(0);
  const [zoomedImage, setZoomedImage]           = useState<string | null>(null);
  const [selectedTweaks, setSelectedTweaks]     = useState<string[]>([]);
  const [uploads, setUploads]                   = useState([
    { id: "1", label: "Front" },
    { id: "2", label: "Side" },
    { id: "3", label: "Detail" },
  ]);
  const [generatedImages, setGeneratedImages] = useState([
    { id: 0, label: "v1" },
    { id: 1, label: "v2" },
    { id: 2, label: "—"  },
    { id: 3, label: "—"  },
  ]);

  function toggleTweak(t: string) {
    setSelectedTweaks((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  }

  function addUpload() {
    const n = uploads.length + 1;
    setUploads((prev) => [...prev, { id: String(Date.now()), label: `Image ${n}` }]);
  }

  function deleteUpload(id: string) {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  }

  function deleteGenerated(id: number) {
    setGeneratedImages((prev) => prev.filter((g) => g.id !== id));
    if (selectedGenerated === id) {
      const remaining = generatedImages.filter((g) => g.id !== id);
      if (remaining.length > 0) setSelectedGenerated(remaining[0].id);
    }
  }

  const canvas = CANVAS_SIZES[selectedRatio];

  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: "#0d0f14" }}>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left sidebar ── */}
        {leftOpen ? (
          <div
            className="w-[180px] border-r border-white/[0.07] flex flex-col flex-shrink-0"
            style={{ background: "#0d0f14" }}
          >
            {/* Sidebar header: Campaigns ← | collapse */}
            <div className="flex items-center justify-between px-2 py-2 flex-shrink-0 border-b border-white/[0.04]">
              <button
                onClick={onBack}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/5 transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M19 12H5" /><path d="M12 5l-7 7 7 7" />
                </svg>
                Campaigns
              </button>
              <button
                onClick={() => setLeftOpen(false)}
                className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
                aria-label="Collapse left sidebar"
              >
                <LeftSidebarIcon />
              </button>
            </div>

            {/* Scrollable content */}
            <div
              className="flex-1 overflow-y-auto"
              style={{ scrollbarWidth: "none" } as React.CSSProperties}
            >
              {/* Campaign info */}
              <div className="px-4 pt-4 pb-3 border-b border-white/[0.05]">
                {editingName ? (
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => setEditingName(false)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") setEditingName(false); }}
                    className="w-full bg-white/5 border border-blue-400/50 rounded-lg px-2 py-1 text-sm font-bold text-white outline-none"
                  />
                ) : (
                  <p className="text-sm font-bold text-white truncate">{name}</p>
                )}
                <p className="text-xs text-white/40 mt-0.5">Cold Brew Blend</p>
                <button
                  onClick={() => setEditingName(true)}
                  className="mt-3 w-full px-3 py-2 rounded-xl border border-white/10 text-sm font-medium text-white/70 hover:text-white hover:border-white/20 bg-white/[0.02] transition-colors"
                >
                  Edit name
                </button>
              </div>

              {/* Uploaded */}
              <div className="px-4 py-3 border-b border-white/[0.05]">
                <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">Uploaded</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {uploads.map((u) => (
                    <DeletableTile
                      key={u.id}
                      onDelete={() => deleteUpload(u.id)}
                      onClick={() => setZoomedImage(u.label)}
                      className="rounded-xl border border-blue-400/30 bg-blue-500/5 hover:border-blue-400/60 flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <span className="text-[10px] text-white/40 text-center px-1 leading-tight">{u.label}</span>
                    </DeletableTile>
                  ))}
                  <button
                    onClick={addUpload}
                    className="aspect-square rounded-xl border border-dashed border-white/10 bg-white/[0.02] flex items-center justify-center text-white/30 hover:text-white/60 hover:border-white/20 transition-colors text-xl font-light"
                    aria-label="Add upload"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Generated */}
              <div className="px-4 py-3 border-b border-white/[0.05]">
                <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">Generated</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {generatedImages.map((g) => (
                    <DeletableTile
                      key={g.id}
                      onDelete={() => deleteGenerated(g.id)}
                      onClick={() => setSelectedGenerated(g.id)}
                      className={`rounded-xl border flex items-center justify-center transition-colors ${
                        selectedGenerated === g.id
                          ? "border-blue-400/60 bg-blue-500/10"
                          : "border-white/[0.07] bg-white/[0.03] hover:border-white/20"
                      }`}
                    >
                      <span className="text-[10px] text-white/30">{g.label}</span>
                    </DeletableTile>
                  ))}
                </div>
              </div>

              {/* Media */}
              <div className="px-4 py-3 pb-5">
                <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">Media</p>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-600/20 border border-blue-500/30">
                    <VideoIcon />
                    <div>
                      <p className="text-xs font-semibold text-white">Ad video</p>
                      <p className="text-[10px] text-white/40">15s · pending</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                    <MusicIcon />
                    <div>
                      <p className="text-xs font-semibold text-white">Audio jingle</p>
                      <p className="text-[10px] text-white/40">30s · pending</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Collapsed left — narrow strip */
          <div
            className="w-9 border-r border-white/[0.07] flex flex-col items-center gap-2 pt-2 flex-shrink-0"
            style={{ background: "#0d0f14" }}
          >
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
              aria-label="Back to campaigns"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M19 12H5" /><path d="M12 5l-7 7 7 7" />
              </svg>
            </button>
            <button
              onClick={() => setLeftOpen(true)}
              className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
              aria-label="Expand left sidebar"
            >
              <LeftSidebarIcon />
            </button>
          </div>
        )}

        {/* ── Center ── */}
        <div
          className="flex-1 flex flex-col overflow-auto"
          style={{ background: "#0f1117" }}
        >
          {/* Center top bar */}
          <div className="flex items-center justify-end px-4 py-2 border-b border-white/[0.04] flex-shrink-0">
            <button className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/40">
              Save version
            </button>
          </div>

          {/* Canvas area */}
          <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="flex items-center gap-2 mb-6">
            {(["1:1", "4:5", "9:16", "16:9"] as AspectRatio[]).map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRatio(r)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  selectedRatio === r
                    ? "bg-blue-600/40 text-blue-300 border-blue-400/40"
                    : "text-white/40 border-white/10 hover:text-white/60"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <div
            className="rounded-2xl bg-white shadow-2xl transition-all duration-300"
            style={{ width: canvas.w, height: canvas.h }}
          />

          <p className="text-xs text-white/30 mt-3">
            {selectedScene ?? selectedStudio} · {selectedRatio}
          </p>
          </div>
        </div>

        {/* ── Right sidebar ── */}
        {rightOpen ? (
          <div
            className="w-[260px] border-l border-white/[0.07] flex flex-col flex-shrink-0"
            style={{ background: "#0d0f14" }}
          >
            {/* Sidebar header: collapse | tabs | ... */}
            <div className="flex items-center px-2 py-2 flex-shrink-0 border-b border-white/[0.04]">
              <button
                onClick={() => setRightOpen(false)}
                className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors flex-shrink-0"
                aria-label="Collapse right sidebar"
              >
                <RightSidebarIcon />
              </button>
              {/* Tabs */}
              <div className="flex items-center overflow-x-auto gap-0.5 flex-1 ml-1" style={{ scrollbarWidth: "none" } as React.CSSProperties}>
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`text-xs font-medium px-2.5 py-1.5 whitespace-nowrap transition-colors rounded-lg flex-shrink-0 ${
                      activeTab === tab
                        ? "text-white border-b-2 border-blue-400"
                        : "text-white/40 hover:text-white/70"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <button className="p-1.5 text-white/30 hover:text-white/60 transition-colors flex-shrink-0 ml-1" aria-label="More options">
                <DotsIcon />
              </button>
            </div>

            {/* Tab content */}
            <div
              className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5"
              style={{ scrollbarWidth: "none" } as React.CSSProperties}
            >
              {/* Background tab */}
              {activeTab === "Background" && (
                <>
                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Studio</p>
                    <div className="flex flex-col gap-1.5">
                      {STUDIOS.map((s) => (
                        <button
                          key={s.name}
                          onClick={() => { setSelectedStudio(s.name); setSelectedScene(null); }}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-colors ${
                            selectedStudio === s.name && selectedScene === null
                              ? "border-blue-400/50 bg-blue-500/10"
                              : "border-white/[0.07] hover:border-white/15 bg-white/[0.02]"
                          }`}
                        >
                          <span className="w-6 h-6 rounded-full border border-white/20 flex-shrink-0" style={{ background: s.color }} />
                          <span>
                            <span className="text-xs font-semibold text-white block">{s.name}</span>
                            <span className="text-[10px] text-white/40">{s.desc}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Scenes</p>
                    <div className="flex flex-col gap-1.5">
                      {SCENES.map((s) => (
                        <button
                          key={s.name}
                          onClick={() => setSelectedScene(s.name)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-colors ${
                            selectedScene === s.name
                              ? "border-blue-400/50 bg-blue-500/10"
                              : "border-white/[0.07] hover:border-white/15 bg-white/[0.02]"
                          }`}
                        >
                          <span className="w-6 h-6 rounded-full border border-white/20 flex-shrink-0" style={{ background: s.color }} />
                          <span>
                            <span className="text-xs font-semibold text-white block">{s.name}</span>
                            <span className="text-[10px] text-white/40">{s.desc}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Position tab */}
              {activeTab === "Position" && (
                <>
                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Placement</p>
                    <PlacementGrid value={placement} onChange={setPlacement} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Size</p>
                    <PillSelector options={SIZES} value={selectedSize} onChange={setSelectedSize} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Depth</p>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-white/40 w-8 text-right">Flat</span>
                      <input type="range" min={0} max={100} value={depthValue} onChange={(e) => setDepthValue(Number(e.target.value))} className="flex-1 accent-blue-500 cursor-pointer" />
                      <span className="text-[10px] text-white/40 w-12">3D angle</span>
                    </div>
                  </div>
                </>
              )}

              {/* Text tab */}
              {activeTab === "Text" && (
                <>
                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Show on Ad</p>
                    <div className="flex flex-col gap-2.5">
                      {[
                        { label: "Brand name", value: showBrandName, set: setShowBrandName },
                        { label: "Tagline",    value: showTagline,   set: setShowTagline   },
                        { label: "Price / CTA",value: showPriceCTA,  set: setShowPriceCTA  },
                      ].map(({ label, value, set }) => (
                        <label key={label} className="flex items-center gap-2.5 cursor-pointer">
                          <input type="checkbox" checked={value} onChange={(e) => set(e.target.checked)} className="accent-blue-500 w-4 h-4 cursor-pointer" />
                          <span className="text-sm text-white/60">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Text Position</p>
                    <PlacementGrid value={textPlacement} onChange={setTextPlacement} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Font Style</p>
                    <PillSelector options={FONT_STYLES} value={selectedFontStyle} onChange={setSelectedFontStyle} />
                  </div>
                </>
              )}

              {/* Style tab */}
              {activeTab === "Style" && (
                <>
                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Ad Personality</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {PERSONALITIES.map((p) => (
                        <button
                          key={p.name}
                          onClick={() => setSelectedPersonality(p.name)}
                          className={`px-3 py-2.5 rounded-xl border text-left transition-colors ${
                            selectedPersonality === p.name
                              ? "border-blue-400/50 bg-blue-500/10"
                              : "border-white/[0.07] bg-white/[0.02] hover:border-white/15"
                          }`}
                        >
                          <p className="text-xs font-semibold text-white leading-snug">{p.name}</p>
                          <p className="text-[10px] text-white/40 mt-0.5 leading-snug">{p.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Lighting</p>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-white/40 whitespace-nowrap">Soft &amp; natural</span>
                      <input type="range" min={0} max={100} value={lightingValue} onChange={(e) => setLightingValue(Number(e.target.value))} className="flex-1 accent-blue-500 cursor-pointer" />
                      <span className="text-[10px] text-white/40 whitespace-nowrap">Dramatic</span>
                    </div>
                  </div>
                </>
              )}

              {/* Tweaks tab */}
              {activeTab === "Tweaks" && (
                <>
                  {TWEAKS.map((section) => (
                    <div key={section.label} className="flex flex-col gap-2">
                      <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">{section.label}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {section.options.map((opt) => {
                          const on = selectedTweaks.includes(opt);
                          return (
                            <button
                              key={opt}
                              onClick={() => toggleTweak(opt)}
                              className={`rounded-full px-3 py-1 text-xs border transition-colors ${
                                on
                                  ? "bg-blue-600/40 text-blue-300 border-blue-400/40"
                                  : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:text-white/60"
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Right sidebar footer */}
            <div className="flex-shrink-0 px-4 py-4 border-t border-white/[0.05]">
              <button className="w-full py-3 rounded-xl text-sm font-semibold text-white border border-white/20 hover:border-white/40 flex items-center justify-center gap-2 transition-colors">
                Regenerate with changes
                <DiagonalArrowIcon />
              </button>
              <p className="text-[10px] text-white/25 text-center mt-1.5">Uses 1 generation credit</p>
            </div>
          </div>
        ) : (
          /* Collapsed right — narrow strip */
          <div
            className="w-9 border-l border-white/[0.07] flex flex-col items-center pt-2 flex-shrink-0"
            style={{ background: "#0d0f14" }}
          >
            <button
              onClick={() => setRightOpen(true)}
              className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
              aria-label="Expand right sidebar"
            >
              <RightSidebarIcon />
            </button>
          </div>
        )}
      </div>

      {/* ── Lightbox ── */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setZoomedImage(null)}
        >
          <div
            className="w-80 h-80 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-white/50 text-sm">{zoomedImage}</span>
          </div>
          <button
            onClick={() => setZoomedImage(null)}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Close lightbox"
          >
            <XIcon size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
