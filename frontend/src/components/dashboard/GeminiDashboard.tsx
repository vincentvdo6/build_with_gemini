"use client";

// ─── Icons ────────────────────────────────────────────────────────────────────

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function NewChatIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

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
      style={{ background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)" }}
      aria-label={`Account: ${userName}`}
    >
      {initials}
    </button>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const RECENT_CAMPAIGNS = [
  "Sunrise Coffee",
  "NovaTech Earbuds",
  "Green Garden Skincare",
  "Q3 awareness — video",
];

function Sidebar() {
  return (
    <aside
      className="flex flex-col h-screen w-[260px] flex-shrink-0 border-r border-white/[0.07]"
      style={{ backgroundColor: "#0f0f13" }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-3">
        <button className="p-2 rounded-full text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors" aria-label="Toggle sidebar">
          <MenuIcon />
        </button>
        <button className="p-2 rounded-full text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors" aria-label="Search">
          <SearchIcon />
        </button>
      </div>

      {/* New campaign */}
      <div className="px-3 pb-1">
        <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors text-left">
          <NewChatIcon />
          New campaign
        </button>
      </div>

      {/* Your files */}
      <div className="px-3 pb-2">
        <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors text-left">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          Your files
        </button>
      </div>

      {/* Your campaigns */}
      <div className="flex-1 overflow-y-auto px-3 pb-2">
        <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest px-2 mb-1">Your campaigns</p>
        <nav className="flex flex-col gap-0.5">
          {RECENT_CAMPAIGNS.map((campaign) => (
            <button key={campaign} className="flex items-center px-3 py-2 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors text-left truncate w-full">
              {campaign}
            </button>
          ))}
        </nav>
      </div>

      {/* Bottom */}
      <div className="px-3 pb-3 pt-2 border-t border-white/[0.05]">
        <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors text-left">
          <GearIcon />
          Settings &amp; help
        </button>
      </div>
    </aside>
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
  /** tailwind bg class for the preview area */
  previewBg: string;
  /** tailwind bg class for the preview thumbnail shape */
  thumbBg: string;
  thumbShape: "rect" | "circle";
}

const STATUS_STYLES: Record<CampaignStatus, { label: string; className: string }> = {
  complete:   { label: "Complete",     className: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" },
  generating: { label: "Generating…",  className: "bg-amber-500/20  text-amber-400  border border-amber-500/30"  },
  draft:      { label: "Draft",        className: "bg-white/10       text-white/50   border border-white/10"       },
};

const CAMPAIGNS: Campaign[] = [
  { id: "1", name: "Sunrise Coffee",       assets: "3 images · 1 video · 1 jingle", timeAgo: "2 hours ago",  status: "complete",   previewBg: "bg-[#2a1a08]", thumbBg: "bg-[#c17f3a]",  thumbShape: "rect"   },
  { id: "2", name: "NovaTech Earbuds",     assets: "2 images · 1 video · 1 jingle", timeAgo: "5 hours ago",  status: "complete",   previewBg: "bg-[#0a0f1e]", thumbBg: "bg-[#2d4a8a]",  thumbShape: "circle" },
  { id: "3", name: "Green Garden Skincare",assets: "3 images · video pending",       timeAgo: "Just now",     status: "generating", previewBg: "bg-[#0d1f12]", thumbBg: "bg-[#2d5c3a]",  thumbShape: "rect"   },
];

function CampaignCard({ campaign }: { campaign: Campaign }) {
  const status = STATUS_STYLES[campaign.status];
  return (
    <button
      className="group flex flex-col rounded-2xl overflow-hidden border border-white/[0.07] hover:border-violet-400/30 transition-all duration-200 text-left w-full"
      style={{ background: "rgba(255,255,255,0.02)" }}
    >
      {/* Preview area */}
      <div className={`relative w-full h-44 flex items-center justify-center ${campaign.previewBg}`}>
        {/* Status badge */}
        <span className={`absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full ${status.className}`}>
          {status.label}
        </span>
        {/* Thumbnail shape */}
        {campaign.thumbShape === "rect" ? (
          <div className={`w-20 h-24 rounded-xl ${campaign.thumbBg}`} />
        ) : (
          <div className={`w-20 h-20 rounded-full ${campaign.thumbBg}`} />
        )}
      </div>

      {/* Info */}
      <div className="px-4 py-4">
        <p className="text-base font-bold text-white mb-1 group-hover:text-violet-300 transition-colors">{campaign.name}</p>
        <p className="text-sm text-white/40 mb-1">{campaign.assets}</p>
        <p className="text-xs text-white/25">{campaign.timeAgo}</p>
      </div>
    </button>
  );
}

// ─── Main content ─────────────────────────────────────────────────────────────

function MainContent({ userName }: { userName: string }) {
  return (
    <main className="flex-1 flex flex-col h-screen overflow-hidden" style={{ backgroundColor: "#0f0f13" }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.05] flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-white tracking-tight">AdCraft</span>
          <span className="px-3 py-1 rounded-lg text-sm font-medium text-white/60 bg-white/5">Dashboard</span>
        </div>
        <AccountButton userName={userName} />
      </div>

      {/* Campaign grid */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CAMPAIGNS.map((c) => (
            <CampaignCard key={c.id} campaign={c} />
          ))}
        </div>
      </div>
    </main>
  );
}

// ─── Root dashboard ───────────────────────────────────────────────────────────

interface GeminiDashboardProps {
  userName?: string;
}

export default function GeminiDashboard({ userName = "User" }: GeminiDashboardProps) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#0f0f13" }}>
      <Sidebar />
      <MainContent userName={userName} />
    </div>
  );
}
