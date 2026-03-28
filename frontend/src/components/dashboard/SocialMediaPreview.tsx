"use client";

import { useEffect, useRef, useState } from "react";

interface MediaImage {
  id: string;
  label: string;
  previewUrl?: string;
}

interface SocialMediaPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  campaignName: string;
  subtitle: string;
  images?: MediaImage[];
  videoUrl?: string;
  audioUrl?: string;
}

type Slide =
  | { type: "image"; id: string; label: string; previewUrl?: string; colorIndex: number }
  | { type: "video"; videoUrl?: string; audioUrl?: string };

// ─── Colors ───────────────────────────────────────────────────────────────────

const SLIDE_COLORS = [
  "from-violet-600 via-fuchsia-600 to-pink-500",
  "from-sky-500 via-blue-600 to-indigo-700",
  "from-emerald-500 via-teal-600 to-cyan-700",
  "from-orange-500 via-rose-500 to-pink-600",
  "from-yellow-500 via-orange-500 to-red-500",
];

// ─── Image slide ──────────────────────────────────────────────────────────────

function ImageSlide({ slide }: { slide: Extract<Slide, { type: "image" }> }) {
  const gradient = SLIDE_COLORS[slide.colorIndex % SLIDE_COLORS.length];

  if (slide.previewUrl) {
    return (
      <div className="w-full h-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={slide.previewUrl} alt={slide.label} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div className={`w-full h-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center relative overflow-hidden`}>
      <div className="absolute inset-0 bg-black/10" />
      <div className="relative flex flex-col items-center gap-2 px-4">
        <div className="w-14 h-14 rounded-2xl bg-white/25 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/20">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" fill="white" stroke="none" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </div>
        <p className="text-white text-[11px] font-semibold drop-shadow">{slide.label}</p>
      </div>
    </div>
  );
}

// ─── Video slide ──────────────────────────────────────────────────────────────

function VideoSlide({
  slide,
  isActive,
}: {
  slide: Extract<Slide, { type: "video" }>;
  isActive: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  // Auto-play when slide becomes active
  useEffect(() => {
    if (isActive) {
      audioRef.current?.play().catch(() => {});
      videoRef.current?.play().catch(() => {});
      setPlaying(true);
    } else {
      audioRef.current?.pause();
      videoRef.current?.pause();
      setPlaying(false);
    }
  }, [isActive]);

  function togglePlay() {
    if (playing) {
      audioRef.current?.pause();
      videoRef.current?.pause();
      setPlaying(false);
    } else {
      audioRef.current?.play().catch(() => {});
      videoRef.current?.play().catch(() => {});
      setPlaying(true);
    }
  }

  return (
    <div className="w-full h-full bg-black flex items-center justify-center relative overflow-hidden">
      {/* Hidden audio element */}
      {slide.audioUrl && (
        <audio ref={audioRef} src={slide.audioUrl} loop preload="auto" />
      )}

      {/* Video element or placeholder */}
      {slide.videoUrl ? (
        <video
          ref={videoRef}
          src={slide.videoUrl}
          className="w-full h-full object-cover"
          loop
          playsInline
          muted={!slide.audioUrl}
        />
      ) : (
        /* Placeholder when no video URL yet */
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="15" height="14" rx="2" />
                <path d="M17 9l5-3v12l-5-3V9z" fill="white" stroke="none" />
              </svg>
            </div>
            <p className="text-white/50 text-[10px]">Video · 15s</p>
          </div>
        </div>
      )}

      {/* Audio waveform when active */}
      {slide.audioUrl && isActive && (
        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-1.5 bg-black/60 rounded-full px-3 py-1.5">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
            <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3" fill="white"/><circle cx="18" cy="16" r="3" fill="white"/>
          </svg>
          <div className="flex items-end gap-0.5 h-3">
            {[3, 5, 7, 4, 6, 8, 3, 5, 7, 4, 6, 5, 3].map((h, i) => (
              <div
                key={i}
                className="w-0.5 bg-white/70 rounded-full"
                style={{
                  height: playing ? `${h * 1.5}px` : "3px",
                  transition: "height 0.15s ease",
                  animationDelay: `${i * 0.07}s`,
                }}
              />
            ))}
          </div>
          <p className="text-white/70 text-[9px] ml-0.5 truncate flex-1">Campaign Jingle</p>
        </div>
      )}

      {/* Play/pause tap target */}
      <button
        onClick={togglePlay}
        className="absolute inset-0 flex items-center justify-center"
        aria-label={playing ? "Pause" : "Play"}
      >
        {!playing && (
          <div className="w-12 h-12 rounded-full bg-black/50 border border-white/30 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        )}
      </button>

      {/* Video badge */}
      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full bg-black/60 flex items-center gap-1">
        <svg width="8" height="8" viewBox="0 0 24 24" fill="white">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
        <span className="text-white text-[9px] font-semibold">VIDEO</span>
      </div>
    </div>
  );
}

// ─── Instagram post ───────────────────────────────────────────────────────────

function InstagramPost({
  campaignName,
  subtitle,
  slides,
}: {
  campaignName: string;
  subtitle: string;
  slides: Slide[];
}) {
  const [index, setIndex] = useState(0);
  const handle = campaignName.toLowerCase().replace(/\s+/g, "");
  const total = slides.length;

  function prev() { setIndex((i) => Math.max(i - 1, 0)); }
  function next() { setIndex((i) => Math.min(i + 1, total - 1)); }

  return (
    <div className="w-full h-full bg-white flex flex-col text-gray-900 select-none overflow-hidden">

      {/* Post header */}
      <div className="flex items-center justify-between px-3 py-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full p-[1.5px] flex-shrink-0" style={{ background: "linear-gradient(45deg, #f9ce34, #ee2a7b, #6228d7)" }}>
            <div className="w-full h-full rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500" />
          </div>
          <div className="leading-none">
            <p className="text-[11px] font-semibold">{handle}</p>
            <p className="text-[9px] text-gray-400">Sponsored</p>
          </div>
        </div>
        <span className="text-gray-400 text-base leading-none tracking-widest">···</span>
      </div>

      {/* Carousel */}
      <div className="relative flex-shrink-0 overflow-hidden bg-gray-100" style={{ height: 230 }}>
        <div
          className="flex h-full"
          style={{
            transform: `translateX(-${index * (100 / total)}%)`,
            width: `${total * 100}%`,
            transition: "transform 0.3s ease-in-out",
          }}
        >
          {slides.map((slide, i) => (
            <div key={i} className="h-full flex-shrink-0" style={{ width: `${100 / total}%` }}>
              {slide.type === "image" ? (
                <ImageSlide slide={slide} />
              ) : (
                <VideoSlide slide={slide} isActive={index === i} />
              )}
            </div>
          ))}
        </div>

        {/* Prev arrow */}
        {index > 0 && (
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/90 shadow-md flex items-center justify-center z-10"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}
        {index < total - 1 && (
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/90 shadow-md flex items-center justify-center z-10"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}

        {/* Counter */}
        {total > 1 && (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-black/50 text-white text-[9px] font-semibold z-10">
            {index + 1}/{total}
          </div>
        )}
      </div>

      {/* Dot indicators */}
      {total > 1 && (
        <div className="flex items-center justify-center gap-1 py-1.5 flex-shrink-0">
          {slides.map((slide, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`rounded-full transition-all duration-200 flex items-center justify-center ${
                i === index ? "w-3.5 h-1.5 bg-[#0095f6]" : "w-1.5 h-1.5 bg-gray-300"
              }`}
            >
              {slide.type === "video" && i !== index && (
                <svg width="5" height="5" viewBox="0 0 24 24" fill="#666"><polygon points="5 3 19 12 5 21 5 3" /></svg>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="px-3 pt-1.5 pb-1 flex-shrink-0">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-3 text-gray-800">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <p className="text-[10px] font-semibold">2,847 likes</p>
        <p className="text-[10px] mt-0.5 leading-snug">
          <span className="font-semibold">{handle}</span>
          {" "}{subtitle}{" "}
          <span className="text-[#0095f6]">#ad #newproduct</span>
        </p>
        <p className="text-[9px] text-gray-400 mt-0.5">View all 143 comments</p>
        <p className="text-[9px] text-gray-300 mt-0.5 uppercase tracking-wide">2 hours ago</p>
      </div>

      {/* Bottom nav */}
      <div className="flex items-center justify-around py-2 border-t border-gray-100 flex-shrink-0 text-gray-800 mt-auto">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
        </svg>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="2.18" /><line x1="7" y1="2" x2="7" y2="22" /><line x1="17" y1="2" x2="17" y2="22" /><line x1="2" y1="12" x2="22" y2="12" />
        </svg>
        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500" />
      </div>
    </div>
  );
}

// ─── Phone frame ──────────────────────────────────────────────────────────────

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative flex-shrink-0 rounded-[2.75rem] overflow-hidden"
      style={{
        width: 270,
        height: 540,
        background: "#111",
        boxShadow: "0 0 0 1.5px #333, 0 0 0 3px #222, 0 40px 80px rgba(0,0,0,0.7)",
      }}
    >
      <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-30 w-16 h-4 rounded-full bg-black border border-white/5" />
      <div className="absolute inset-0 rounded-[2.75rem] overflow-hidden pt-8">{children}</div>
      <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 z-30 w-20 h-1 rounded-full bg-white/20" />
    </div>
  );
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_IMAGES: MediaImage[] = [
  { id: "1", label: "Image 1" },
  { id: "2", label: "Image 2" },
  { id: "3", label: "Image 3" },
];

// ─── Modal ────────────────────────────────────────────────────────────────────

export default function SocialMediaPreview({
  isOpen,
  onClose,
  campaignName,
  subtitle,
  images,
  videoUrl,
  audioUrl,
}: SocialMediaPreviewProps) {
  if (!isOpen) return null;

  const sourceImages = images && images.length > 0 ? images : DEFAULT_IMAGES;

  const slides: Slide[] = [
    ...sourceImages.map((img, i) => ({
      type: "image" as const,
      ...img,
      colorIndex: i,
    })),
    // Video is always appended as the last slide
    { type: "video" as const, videoUrl, audioUrl },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl border border-white/[0.08] flex flex-col overflow-hidden shadow-2xl"
        style={{ background: "#0d0f14", maxWidth: 400, width: "100%" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div>
            <p className="text-sm font-semibold text-white">Post Preview</p>
            <p className="text-[11px] text-white/40 mt-0.5">Swipe through photos and video</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Phone */}
        <div className="flex items-center justify-center py-8" style={{ background: "#080a0f" }}>
          <PhoneFrame>
            <InstagramPost campaignName={campaignName} subtitle={subtitle} slides={slides} />
          </PhoneFrame>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/[0.06] text-center">
          <p className="text-[10px] text-white/25">
            Final output will show your generated campaign assets
          </p>
        </div>
      </div>
    </div>
  );
}
