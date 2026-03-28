"use client";

import { useState } from "react";

// ─── Gemini 4-pointed star ────────────────────────────────────────────────────

function GeminiStar({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Top lobe – blue */}
      <path d="M16 2 C15.2 8 15.2 12 16 16 C16.8 12 16.8 8 16 2Z" fill="#4285F4" />
      {/* Right lobe – red */}
      <path d="M30 16 C24 15.2 20 15.2 16 16 C20 16.8 24 16.8 30 16Z" fill="#EA4335" />
      {/* Bottom lobe – yellow */}
      <path d="M16 30 C16.8 24 16.8 20 16 16 C15.2 20 15.2 24 16 30Z" fill="#FBBC04" />
      {/* Left lobe – green */}
      <path d="M2 16 C8 16.8 12 16.8 16 16 C12 15.2 8 15.2 2 16Z" fill="#34A853" />
    </svg>
  );
}

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

function PencilIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
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

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function ToolsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="6" height="6" rx="1" />
      <rect x="9" y="3" width="6" height="6" rx="1" />
      <rect x="16" y="3" width="6" height="6" rx="1" />
      <rect x="2" y="10" width="6" height="6" rx="1" />
      <rect x="9" y="10" width="6" height="6" rx="1" />
      <rect x="16" y="10" width="6" height="6" rx="1" />
    </svg>
  );
}

function DiamondIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 22 12 12 22 2 12" />
    </svg>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar() {
  const [gemsOpen, setGemsOpen] = useState(true);

  return (
    <aside
      className="flex flex-col h-screen w-[280px] flex-shrink-0 px-3 py-4"
      style={{ backgroundColor: "#131314" }}
    >
      {/* Top row */}
      <div className="flex items-center justify-between px-2 mb-6">
        <button
          className="p-2 rounded-full text-[#9aa0a6] hover:bg-white/10 transition-colors"
          aria-label="Menu"
        >
          <MenuIcon />
        </button>
        <button
          className="p-2 rounded-full text-[#9aa0a6] hover:bg-white/10 transition-colors"
          aria-label="Search"
        >
          <SearchIcon />
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex flex-col gap-0.5">
        <button className="flex items-center gap-3 px-3 py-2.5 rounded-full text-sm text-[#e3e3e3] hover:bg-white/10 transition-colors text-left">
          <PencilIcon />
          New chat
        </button>
        <button className="flex items-center gap-3 px-3 py-2.5 rounded-full text-sm text-[#e3e3e3] hover:bg-white/10 transition-colors text-left">
          <HeartIcon />
          My stuff
        </button>
      </nav>

      {/* Gems section */}
      <div className="mt-5">
        <button
          onClick={() => setGemsOpen((v) => !v)}
          className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium text-[#e3e3e3] hover:bg-white/10 transition-colors"
        >
          <span>Gems</span>
          <span
            className="text-[#9aa0a6] transition-transform duration-200"
            style={{ transform: gemsOpen ? "rotate(90deg)" : "rotate(0deg)" }}
          >
            <ChevronRightIcon />
          </span>
        </button>

        {gemsOpen && (
          <div className="mt-0.5 flex flex-col gap-0.5">
            <button className="flex items-center gap-3 px-3 py-2.5 rounded-full text-sm text-[#9aa0a6] hover:bg-white/10 transition-colors text-left">
              <DiamondIcon />
              physicsgoat
            </button>
          </div>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom */}
      <div className="flex flex-col gap-1.5 pb-2">
        <button className="flex items-center gap-3 px-3 py-2.5 rounded-full text-sm text-[#9aa0a6] hover:bg-white/10 transition-colors text-left">
          <GearIcon />
          Settings &amp; help
        </button>

        <button
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium text-white transition-colors"
          style={{ backgroundColor: "#1a73e8" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1557b0")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#1a73e8")}
        >
          <GeminiStar className="w-4 h-4" />
          Upgrade
        </button>
      </div>
    </aside>
  );
}

// ─── Chat input ───────────────────────────────────────────────────────────────

function ChatInput() {
  const [value, setValue] = useState("");

  return (
    <div
      className="w-full max-w-[720px] rounded-2xl px-4 pt-4 pb-3"
      style={{ backgroundColor: "#1e2124" }}
    >
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ask Gemini 3"
        rows={1}
        className="w-full bg-transparent text-[#e3e3e3] placeholder-[#9aa0a6] text-base resize-none outline-none leading-relaxed"
        style={{ minHeight: "28px", maxHeight: "200px" }}
        onInput={(e) => {
          const el = e.currentTarget;
          el.style.height = "auto";
          el.style.height = `${el.scrollHeight}px`;
        }}
      />

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-3">
          <button
            className="p-1.5 rounded-full text-[#9aa0a6] hover:bg-white/10 transition-colors"
            aria-label="Attach"
          >
            <PlusIcon />
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm text-[#9aa0a6] hover:bg-white/10 transition-colors">
            <ToolsIcon />
            Tools
          </button>
        </div>

        <button
          disabled={!value.trim()}
          className="p-2 rounded-full transition-colors disabled:opacity-30"
          style={{ backgroundColor: value.trim() ? "#3c3f41" : "transparent" }}
          aria-label="Send"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#e3e3e3] rotate-90">
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Main content ─────────────────────────────────────────────────────────────

function MainContent() {
  return (
    <main className="flex-1 flex flex-col h-screen overflow-hidden" style={{ backgroundColor: "#131314" }}>
      {/* Top-right toolbar */}
      <div className="flex items-center justify-end gap-3 px-6 py-4">
        <button
          className="px-3 py-1 rounded-md text-xs font-semibold text-[#9aa0a6] border border-[#3c3f41] hover:bg-white/5 transition-colors"
          aria-label="PRO"
        >
          PRO
        </button>
        <button
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-white"
          style={{ backgroundColor: "#1a73e8" }}
          aria-label="User profile"
        >
          P
        </button>
      </div>

      {/* Centered greeting + input */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-16">
        <div className="flex items-center gap-3 mb-2">
          <GeminiStar className="w-8 h-8" />
          <span className="text-2xl font-normal text-[#e3e3e3]">Hi Phillip</span>
        </div>

        <h1 className="text-[2.4rem] font-semibold text-[#e3e3e3] mb-10 leading-tight">
          Where should we start?
        </h1>

        <ChatInput />
      </div>
    </main>
  );
}

// ─── Root dashboard ───────────────────────────────────────────────────────────

export default function GeminiDashboard() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#131314" }}>
      <Sidebar />

      {/* Divider */}
      <div className="w-px flex-shrink-0" style={{ backgroundColor: "#2d2f31" }} />

      <MainContent />
    </div>
  );
}
