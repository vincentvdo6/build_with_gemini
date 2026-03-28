"use client";

import { useState } from "react";

interface CampaignEditorProps {
  campaignName: string;
  onBack: () => void;
}

type ActiveTab = "Position" | "Tweaks";
type AspectRatio = "1:1" | "4:5" | "9:16" | "16:9";
type ActiveMedia = "image" | "video" | "audio" | null;

const TABS: ActiveTab[] = ["Position", "Tweaks"];

const SIZES = ["Small", "Medium", "Large", "Full"];

const TWEAKS: string[] = ["Brighter", "Darker", "Warmer", "Cooler", "Bokeh", "Film grain", "Golden hour", "Soft shadow", "More space", "Closer crop"];

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
  const [editingSubtitle, setEditingSubtitle]   = useState(false);
  const [subtitle, setSubtitle]                 = useState("Cold Brew Blend");
  const [leftOpen, setLeftOpen]                 = useState(true);
  const [rightOpen, setRightOpen]               = useState(true);
  const [activeTab, setActiveTab]               = useState<ActiveTab>("Position");
  const [selectedRatio, setSelectedRatio]       = useState<AspectRatio>("1:1");
  const [selectedSize, setSelectedSize]         = useState("Medium");
  const [placement, setPlacement]               = useState(4);
  const [zoomedImage, setZoomedImage]           = useState<string | null>(null);
  const [selectedTweaks, setSelectedTweaks]     = useState<string[]>([]);
  const [activeMedia, setActiveMedia]           = useState<ActiveMedia>(null);
  const [uploads, setUploads]                   = useState([
    { id: "1", label: "Front" },
    { id: "2", label: "Side" },
    { id: "3", label: "Detail" },
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
                  <p
                    className="text-sm font-bold text-white truncate cursor-pointer hover:text-white/80 transition-colors"
                    onClick={() => setEditingName(true)}
                  >{name}</p>
                )}
                {editingSubtitle ? (
                  <input
                    autoFocus
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    onBlur={() => setEditingSubtitle(false)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") setEditingSubtitle(false); }}
                    className="w-full bg-white/5 border border-blue-400/50 rounded-lg px-2 py-0.5 text-xs text-white/70 outline-none mt-0.5"
                  />
                ) : (
                  <p
                    className="text-xs text-white/40 mt-0.5 cursor-pointer hover:text-white/60 transition-colors"
                    onClick={() => setEditingSubtitle(true)}
                  >
                    {subtitle || "Add subtitle…"}
                  </p>
                )}
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

              {/* Media */}
              <div className="px-4 py-3 pb-5">
                <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">Media</p>
                <div className="flex flex-col gap-1.5">
                  {([
                    { id: "image", label: "Image", sub: "pending", active: true, icon: (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400 flex-shrink-0">
                        <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                      </svg>
                    )},
                    { id: "video", label: "Video", sub: "15s · pending", active: false, icon: <VideoIcon /> },
                    { id: "audio", label: "Audio", sub: "30s · pending", active: false, icon: <MusicIcon /> },
                  ] as { id: ActiveMedia; label: string; sub: string; active: boolean; icon: React.ReactNode }[]).map((item) => {
                    const isSelected = activeMedia === item.id;
                    return (
                      <button
                        key={item.id as string}
                        onClick={() => setActiveMedia(isSelected ? null : item.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-colors w-full ${
                          isSelected
                            ? "bg-blue-600/20 border-blue-500/30"
                            : "bg-white/[0.03] border-white/[0.07] hover:border-white/15"
                        }`}
                      >
                        {item.icon}
                        <div>
                          <p className="text-xs font-semibold text-white">{item.label}</p>
                          <p className="text-[10px] text-white/40">{item.sub}</p>
                        </div>
                      </button>
                    );
                  })}
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
            {selectedRatio}
          </p>
          </div>
        </div>

        {/* ── Right sidebar ── */}
        {rightOpen ? (
          <div
            className="w-[260px] border-l border-white/[0.07] flex flex-col flex-shrink-0"
            style={{ background: "#0d0f14" }}
          >
            {/* Sidebar header */}
            <div className="flex items-center px-2 py-2 flex-shrink-0 border-b border-white/[0.04]">
              <button
                onClick={() => setRightOpen(false)}
                className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors flex-shrink-0"
                aria-label="Collapse right sidebar"
              >
                <RightSidebarIcon />
              </button>

              {activeMedia ? (
                /* Media panel header */
                <div className="flex items-center justify-between flex-1 ml-2">
                  <span className="text-xs font-semibold text-white capitalize">{activeMedia}</span>
                  <button
                    onClick={() => setActiveMedia(null)}
                    className="p-1 rounded-lg text-white/30 hover:text-white/60 transition-colors"
                    aria-label="Close media panel"
                  >
                    <XIcon size={10} />
                  </button>
                </div>
              ) : (
                /* Normal tabs */
                <>
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
                </>
              )}
            </div>

            {/* Tab / media content */}
            <div
              className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5"
              style={{ scrollbarWidth: "none" } as React.CSSProperties}
            >
              {activeMedia === "image" && (
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
                    <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Tweaks</p>
                    <div className="flex flex-wrap gap-1.5">
                      {TWEAKS.map((opt) => {
                        const on = selectedTweaks.includes(opt);
                        return (
                          <button key={opt} onClick={() => toggleTweak(opt)}
                            className={`rounded-full px-3 py-1 text-xs border transition-colors ${on ? "bg-blue-600/40 text-blue-300 border-blue-400/40" : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:text-white/60"}`}>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {activeMedia === "video" && (
                <>
                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Duration</p>
                    <PillSelector options={["15s", "30s", "60s"]} value="15s" onChange={() => {}} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Format</p>
                    <PillSelector options={["Landscape", "Portrait", "Square"]} value="Landscape" onChange={() => {}} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Style</p>
                    <PillSelector options={["Dynamic", "Cinematic", "Minimal"]} value="Dynamic" onChange={() => {}} />
                  </div>
                </>
              )}

              {activeMedia === "audio" && (
                <>
                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Duration</p>
                    <PillSelector options={["15s", "30s", "60s"]} value="30s" onChange={() => {}} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Mood</p>
                    <PillSelector options={["Upbeat", "Calm", "Dramatic", "Playful", "Sad", "Melodic"]} value="Upbeat" onChange={() => {}} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Instruments</p>
                    <PillSelector options={["Guitar", "Piano", "Synth", "Drums", "Vocals"]} value="Piano" onChange={() => {}} />
                  </div>
                </>
              )}

              {!activeMedia && (
                <>
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
                    </>
                  )}

                  {/* Tweaks tab */}
                  {activeTab === "Tweaks" && (
                    <div className="flex flex-wrap gap-1.5">
                      {TWEAKS.map((opt) => {
                        const on = selectedTweaks.includes(opt);
                        return (
                          <button key={opt} onClick={() => toggleTweak(opt)}
                            className={`rounded-full px-3 py-1 text-xs border transition-colors ${on ? "bg-blue-600/40 text-blue-300 border-blue-400/40" : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10 hover:text-white/60"}`}>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
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
