"use client";

import { useState } from "react";
import NewCampaignModal from "./NewCampaignModal";
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

function CampaignCard({ campaign, onCardClick }: { campaign: Campaign; onCardClick: (name: string) => void }) {
  const status = STATUS_STYLES[campaign.status];
  return (
    <button
      onClick={() => onCardClick(campaign.name)}
      className="group flex flex-col rounded-2xl overflow-hidden border border-white/[0.07] hover:border-blue-400/30 transition-all duration-200 text-left w-full"
      style={{ background: "rgba(255,255,255,0.02)" }}
    >
      <div className={`relative w-full h-44 flex items-center justify-center ${campaign.previewBg}`}>
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
        <p className="text-base font-bold text-white mb-1 group-hover:text-blue-300 transition-colors">{campaign.name}</p>
        <p className="text-sm text-white/40 mb-1">{campaign.assets}</p>
        <p className="text-xs text-white/25">{campaign.timeAgo}</p>
      </div>
    </button>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

interface GeminiDashboardProps {
  userName?: string;
}

export default function GeminiDashboard({ userName = "User" }: GeminiDashboardProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [showNewCampaign, setShowNewCampaign] = useState(false);
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

  const sortedCampaigns = [...ALL_CAMPAIGNS].sort((a, b) => a.sortOrder - b.sortOrder);

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
          onGenerate={({ businessName }) => {
            setShowNewCampaign(false);
            setEditorCampaign(businessName || "New Campaign");
          }}
        />
      )}
    </div>
  );
}
