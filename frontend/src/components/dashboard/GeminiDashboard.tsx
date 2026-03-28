"use client";

import { useEffect, useRef, useState } from "react";
import NewCampaignModal from "./NewCampaignModal";
import ConceptDirectionScreen from "./ConceptDirectionScreen";
import CampaignEditor from "./CampaignEditor";

// ─── Account avatar button ────────────────────────────────────────────────────

function AccountButton({ userName }: { userName: string }) {
  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <button
      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-white hover:opacity-90 transition-opacity focus:outline-none"
      style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)" }}
      aria-label={`Account: ${userName}`}
    >
      {initials}
    </button>
  );
}

// ─── Campaign card ────────────────────────────────────────────────────────────

type CampaignStatus = "complete" | "generating" | "draft";

interface Campaign {
  id: string;
  name: string;
  assets: string;
  timeAgo: string;
  status: CampaignStatus;
  previewBg: string;
  thumbBg: string;
  thumbShape: "rect" | "circle";
  sortOrder: number;
}

const STATUS_STYLES: Record<CampaignStatus, { label: string; className: string }> = {
  complete:   { label: "Complete",    className: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" },
  generating: { label: "Generating…", className: "bg-amber-500/20  text-amber-400  border border-amber-500/30"  },
  draft:      { label: "Draft",       className: "bg-white/10       text-white/50   border border-white/10"       },
};

const ALL_CAMPAIGNS: Campaign[] = [
  { id: "1", name: "Sunrise Coffee",        assets: "3 images · 1 video · 1 jingle", timeAgo: "2 hours ago", status: "complete",   previewBg: "bg-[#2a1a08]", thumbBg: "bg-[#c17f3a]", thumbShape: "rect",   sortOrder: 1 },
  { id: "2", name: "NovaTech Earbuds",      assets: "2 images · 1 video · 1 jingle", timeAgo: "5 hours ago", status: "complete",   previewBg: "bg-[#0a0f1e]", thumbBg: "bg-[#2d4a8a]", thumbShape: "circle", sortOrder: 2 },
  { id: "3", name: "Green Garden Skincare", assets: "3 images · video pending",       timeAgo: "Just now",    status: "generating", previewBg: "bg-[#0d1f12]", thumbBg: "bg-[#2d5c3a]", thumbShape: "rect",   sortOrder: 0 },
  { id: "4", name: "Q3 Brand Awareness",    assets: "4 images · 2 videos",            timeAgo: "Yesterday",   status: "complete",   previewBg: "bg-[#1a0a2e]", thumbBg: "bg-[#6d3aad]", thumbShape: "rect",   sortOrder: 3 },
  { id: "5", name: "Holiday Promo 2024",    assets: "5 images · 1 jingle",            timeAgo: "3 days ago",  status: "draft",      previewBg: "bg-[#1a0808]", thumbBg: "bg-[#8a2a2a]", thumbShape: "circle", sortOrder: 4 },
];

function CampaignCard({ campaign, onCardClick, onDelete, onRename }: { campaign: Campaign; onCardClick: (name: string) => void; onDelete: (id: string) => void; onRename: (id: string, name: string) => void }) {
  const status = STATUS_STYLES[campaign.status];
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(campaign.name);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  function commitRename() {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== campaign.name) onRename(campaign.id, trimmed);
    setRenaming(false);
  }

  return (
    <div className="relative group">
      <div
        onClick={() => !renaming && onCardClick(campaign.name)}
        className="group/card flex flex-col rounded-2xl border border-white/[0.07] hover:border-blue-400/30 transition-all duration-200 cursor-pointer"
        style={{ background: "rgba(255,255,255,0.02)" }}
      >
        <div className={`relative w-full h-44 flex items-center justify-center rounded-t-2xl ${campaign.previewBg}`}>
          <span className={`absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full ${status.className}`}>
            {status.label}
          </span>
          {campaign.thumbShape === "rect" ? (
            <div className={`w-20 h-24 rounded-xl ${campaign.thumbBg}`} />
          ) : (
            <div className={`w-20 h-20 rounded-full ${campaign.thumbBg}`} />
          )}
        </div>
        <div className="px-4 py-4">
          {/* Name row with 3-dot menu */}
          <div ref={menuRef} className="relative flex items-center justify-between gap-1 mb-1">
            {renaming ? (
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRename();
                  if (e.key === "Escape") { setRenameValue(campaign.name); setRenaming(false); }
                  e.stopPropagation();
                }}
                onClick={(e) => e.stopPropagation()}
                className="text-base font-bold text-white bg-white/10 border border-blue-400/40 rounded-lg px-2 py-0.5 outline-none flex-1 min-w-0"
              />
            ) : (
              <p className="text-base font-bold text-white group-hover/card:text-blue-300 transition-colors truncate flex-1 min-w-0">{campaign.name}</p>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
              className="w-6 h-6 rounded-md text-white/0 group-hover/card:text-white/40 hover:!text-white hover:bg-white/10 flex items-center justify-center flex-shrink-0 transition-colors"
              aria-label="Campaign options"
            >
              <svg width="3" height="11" viewBox="0 0 4 16" fill="currentColor">
                <circle cx="2" cy="2"  r="1.5" />
                <circle cx="2" cy="8"  r="1.5" />
                <circle cx="2" cy="14" r="1.5" />
              </svg>
            </button>

            {menuOpen && (
              <div
                className="absolute top-7 right-0 w-36 rounded-xl border border-white/10 shadow-2xl overflow-hidden z-20"
                style={{ background: "#1c2030" }}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setRenaming(true); setRenameValue(campaign.name); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2.5"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Rename
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2.5"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download
                </button>
                <div className="h-px bg-white/[0.06] mx-3" />
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(campaign.id); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors flex items-center gap-2.5"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                  Remove
                </button>
              </div>
            )}
          </div>
          <p className="text-sm text-white/40 mb-1">{campaign.assets}</p>
          <p className="text-xs text-white/25">{campaign.timeAgo}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

interface GeminiDashboardProps {
  userName?: string;
}

export default function GeminiDashboard({ userName = "User" }: GeminiDashboardProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [campaigns, setCampaigns] = useState(ALL_CAMPAIGNS);
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [pendingCampaign, setPendingCampaign] = useState<{ businessName: string; productName: string } | null>(null);
  const [editorCampaign, setEditorCampaign] = useState<string | null>(null);

  // If an editor is open, render it full-screen instead of the dashboard
  if (editorCampaign !== null) {
    return (
      <CampaignEditor
        campaignName={editorCampaign}
        onBack={() => setEditorCampaign(null)}
      />
    );
  }

  const sortedCampaigns = [...campaigns].sort((a, b) => a.sortOrder - b.sortOrder);

  const filtered = query.trim()
    ? sortedCampaigns.filter((c) =>
        c.name.toLowerCase().includes(query.toLowerCase())
      )
    : sortedCampaigns;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0d0f14" }}>
      {/* Top bar */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-white/[0.05]">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/50">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M10 2L3 7v6l7 5 7-5V7l-7-5z" fill="white" fillOpacity="0.9" />
              <path d="M10 2L3 7l7 5 7-5-7-5z" fill="white" fillOpacity="0.4" />
            </svg>
          </div>
          <span className="text-base font-bold text-white tracking-tight">AdCraft</span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewCampaign(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/40 focus:outline-none"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New campaign
          </button>
          <AccountButton userName={userName} />
        </div>
      </header>

      {/* Main content */}
      <div className="px-8 py-8">
        {/* Section heading + search */}
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-xs font-semibold text-white/30 uppercase tracking-widest">
            Your campaigns
          </h2>

          {/* Search toggle */}
          {searchOpen ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/40 flex-shrink-0">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search campaigns…"
                className="bg-transparent text-sm text-white placeholder-white/30 outline-none w-44"
              />
              <button
                onClick={() => { setSearchOpen(false); setQuery(""); }}
                className="text-white/30 hover:text-white/60 transition-colors ml-1"
                aria-label="Close search"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
              aria-label="Search campaigns"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          )}
        </div>

        {/* Campaign grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((c) => (
              <CampaignCard
                key={c.id}
                campaign={c}
                onCardClick={(name) => setEditorCampaign(name)}
                onDelete={(id) => setCampaigns((prev) => prev.filter((x) => x.id !== id))}
                onRename={(id, name) => setCampaigns((prev) => prev.map((x) => x.id === id ? { ...x, name } : x))}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-white/30 mt-8 text-center">No campaigns match &ldquo;{query}&rdquo;</p>
        )}
      </div>

      {/* New Campaign Modal */}
      {showNewCampaign && (
        <NewCampaignModal
          onClose={() => setShowNewCampaign(false)}
          onGenerate={({ businessName, productName }) => {
            setShowNewCampaign(false);
            setPendingCampaign({ businessName, productName });
          }}
        />
      )}

      {/* Concept Direction Screen */}
      {pendingCampaign && (
        <ConceptDirectionScreen
          businessName={pendingCampaign.businessName}
          productName={pendingCampaign.productName}
          onBack={() => { setPendingCampaign(null); setShowNewCampaign(true); }}
          onGenerate={() => { setEditorCampaign(pendingCampaign.businessName || "New Campaign"); setPendingCampaign(null); }}
        />
      )}
    </div>
  );
}
