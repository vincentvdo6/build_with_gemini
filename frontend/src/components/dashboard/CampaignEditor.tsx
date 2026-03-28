"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import SocialMediaPreview from "./SocialMediaPreview";

// ─── Types ───────────────────────────────────────────────────────────────────

interface CampaignEditorProps {
  campaignId: string;
  campaignName: string;
  files: File[];
  logo: File | null;
  directionIndex: number;
  artDirections: any[];
  imageCount: number;
  onBack: () => void;
}

interface CampaignData {
  id: string;
  name: string;
  status: string;
  images?: string[];
  video?: string;
  jingle?: string;
  final_video?: string;
  error?: string;
}

type GenerationPhase = "idle" | "generating" | "complete" | "error";

const API_BASE = "http://localhost:3001";

// ─── Icons ───────────────────────────────────────────────────────────────────

function BackArrowIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 12H5" />
      <path d="M12 5l-7 7 7 7" />
    </svg>
  );
}

function SpinnerIcon({ size = 48 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 50 50"
      style={{ animation: "spin 1s linear infinite" }}
    >
      <circle
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke="rgba(59,130,246,0.3)"
        strokeWidth="4"
      />
      <circle
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke="#3b82f6"
        strokeWidth="4"
        strokeDasharray="31.4 94.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function CampaignEditor({
  campaignId,
  campaignName,
  files,
  logo,
  directionIndex,
  artDirections,
  imageCount,
  onBack,
}: CampaignEditorProps) {
  const [phase, setPhase] = useState<GenerationPhase>("idle");
  const [statusText, setStatusText] = useState("Initializing campaign...");
  const [progressText, setProgressText] = useState("");
  const [errorText, setErrorText] = useState("");
  const [campaignData, setCampaignData] = useState<CampaignData | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const hasStarted = useRef(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Fetch completed campaign data
  const fetchCampaignData = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/campaigns/${campaignId}`);
      if (!res.ok) throw new Error(`Failed to fetch campaign: ${res.status}`);
      const data: CampaignData = await res.json();
      setCampaignData(data);
      setPhase("complete");
    } catch (err: any) {
      setErrorText(err.message || "Failed to load campaign results.");
      setPhase("error");
    }
  }, [campaignId]);

  // Connect SSE for progress updates
  const connectSSE = useCallback(() => {
    const url = `${API_BASE}/api/campaigns/${campaignId}/stream?token=`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.addEventListener("status", (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        setStatusText(data.message || data.status || "Processing...");
      } catch {
        setStatusText(e.data);
      }
    });

    es.addEventListener("progress", (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        setProgressText(data.message || data.progress || "");
      } catch {
        setProgressText(e.data);
      }
    });

    es.addEventListener("complete", (_e: MessageEvent) => {
      setStatusText("Generation complete!");
      setProgressText("");
      es.close();
      eventSourceRef.current = null;
      fetchCampaignData();
    });

    es.addEventListener("error", (e: any) => {
      if (e.data) {
        try {
          const data = JSON.parse(e.data);
          setErrorText(data.message || data.error || "An error occurred.");
        } catch {
          setErrorText(e.data);
        }
        setPhase("error");
        es.close();
        eventSourceRef.current = null;
      }
    });

    return es;
  }, [campaignId, fetchCampaignData]);

  // Trigger generation on mount
  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const startGeneration = async () => {
      setPhase("generating");
      setStatusText("Starting campaign generation...");

      connectSSE();

      const formData = new FormData();
      files.forEach((file) => {
        formData.append("product_photos", file);
      });
      if (logo) {
        formData.append("logo", logo);
      }
      formData.append("direction_index", String(directionIndex));
      formData.append("image_count", String(imageCount));

      try {
        const res = await fetch(
          `${API_BASE}/api/campaigns/${campaignId}/generate`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!res.ok) {
          const body = await res.text();
          let msg = `Generation request failed (${res.status})`;
          try {
            const parsed = JSON.parse(body);
            msg = parsed.error || parsed.message || msg;
          } catch {
            if (body) msg = body;
          }
          throw new Error(msg);
        }
      } catch (err: any) {
        if (err.name === "TypeError" && err.message.includes("fetch")) {
          setErrorText(
            "Cannot connect to server. Make sure the backend is running on port 3001."
          );
          setPhase("error");
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
          }
        } else {
          setErrorText(err.message);
          setPhase("error");
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
          }
        }
      }
    };

    startGeneration();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [campaignId, files, logo, directionIndex, imageCount, connectSSE]);

  // Derive URLs from campaign data
  const imageUrls: string[] = [];
  if (campaignData?.images) {
    campaignData.images.forEach((img) => {
      if (img.startsWith("http")) {
        imageUrls.push(img);
      } else {
        imageUrls.push(`${API_BASE}/outputs/${campaignId}/${img}`);
      }
    });
  }

  const videoUrl = campaignData?.video
    ? campaignData.video.startsWith("http")
      ? campaignData.video
      : `${API_BASE}/outputs/${campaignId}/${campaignData.video}`
    : null;

  const jingleUrl = campaignData?.jingle
    ? campaignData.jingle.startsWith("http")
      ? campaignData.jingle
      : `${API_BASE}/outputs/${campaignId}/${campaignData.jingle}`
    : null;

  const finalVideoUrl = campaignData?.final_video
    ? campaignData.final_video.startsWith("http")
      ? campaignData.final_video
      : `${API_BASE}/outputs/${campaignId}/${campaignData.final_video}`
    : null;

  return (
    <div
      style={{
        backgroundColor: "#0d0f14",
        color: "#ffffff",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      {/* ── Top Bar ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "16px 24px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          flexShrink: 0,
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.6)",
            cursor: "pointer",
            padding: "8px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "color 0.2s, background-color 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#ffffff";
            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgba(255,255,255,0.6)";
            e.currentTarget.style.backgroundColor = "transparent";
          }}
          aria-label="Go back"
        >
          <BackArrowIcon />
        </button>

        <h1
          style={{
            fontSize: "16px",
            fontWeight: 600,
            margin: 0,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {campaignName}
        </h1>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
          {phase === "generating" && (
            <span style={{ fontSize: "12px", color: "#3b82f6", fontWeight: 500 }}>
              Generating...
            </span>
          )}
          {phase === "complete" && (
            <>
              <span style={{ fontSize: "12px", color: "#22c55e", fontWeight: 500 }}>
                Complete
              </span>
              <button
                onClick={() => setPreviewOpen(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "none",
                  color: "rgba(255,255,255,0.7)",
                  fontSize: "12px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "color 0.2s, border-color 0.2s, background-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#ffffff";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
                  e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                Preview
              </button>
            </>
          )}
          {phase === "error" && (
            <span style={{ fontSize: "12px", color: "#ef4444", fontWeight: 500 }}>
              Error
            </span>
          )}
        </div>
      </div>

      {/* ── Center Content ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: phase === "generating" || phase === "idle" ? "center" : "flex-start",
          overflow: "auto",
          padding: "32px 24px",
        }}
      >
        {/* Generating / Idle */}
        {(phase === "generating" || phase === "idle") && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "24px" }}>
            <SpinnerIcon size={64} />
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "18px", fontWeight: 600, margin: "0 0 8px 0", color: "#ffffff" }}>
                {statusText}
              </p>
              {progressText && (
                <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", margin: 0 }}>
                  {progressText}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Error */}
        {phase === "error" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", maxWidth: "480px", textAlign: "center" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "rgba(239,68,68,0.1)", border: "2px solid rgba(239,68,68,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px" }}>
              !
            </div>
            <p style={{ fontSize: "18px", fontWeight: 600, margin: 0, color: "#ef4444" }}>
              Generation Failed
            </p>
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", margin: 0, lineHeight: "1.5" }}>
              {errorText}
            </p>
            <button
              onClick={onBack}
              style={{ marginTop: "8px", padding: "10px 24px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.2)", backgroundColor: "transparent", color: "#ffffff", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
            >
              Back to Campaigns
            </button>
          </div>
        )}

        {/* Complete */}
        {phase === "complete" && campaignData && (
          <div style={{ width: "100%", maxWidth: "960px" }}>

            {/* Generated Images */}
            {imageUrls.length > 0 && (
              <section style={{ marginBottom: "48px" }}>
                <h2 style={{ fontSize: "14px", fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "16px" }}>
                  Generated Images
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                  {imageUrls.map((url, i) => (
                    <div
                      key={i}
                      style={{ aspectRatio: "1 / 1", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)", backgroundColor: "rgba(255,255,255,0.02)", cursor: "pointer" }}
                      onClick={() => setZoomedImage(url)}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(59,130,246,0.4)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}
                    >
                      <img src={url} alt={`Generated ad image ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Video */}
            {videoUrl && (
              <section style={{ marginBottom: "48px" }}>
                <h2 style={{ fontSize: "14px", fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "16px" }}>
                  Video Ad
                </h2>
                <div style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)", backgroundColor: "#000000" }}>
                  <video src={videoUrl} controls style={{ width: "100%", maxHeight: "480px", display: "block" }} />
                </div>
              </section>
            )}

            {/* Jingle */}
            {jingleUrl && (
              <section style={{ marginBottom: "48px" }}>
                <h2 style={{ fontSize: "14px", fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "16px" }}>
                  Campaign Jingle
                </h2>
                <div style={{ borderRadius: "12px", padding: "20px", border: "1px solid rgba(255,255,255,0.07)", backgroundColor: "rgba(255,255,255,0.02)" }}>
                  <audio src={jingleUrl} controls style={{ width: "100%", display: "block" }} />
                </div>
              </section>
            )}

            {/* Final Video */}
            {finalVideoUrl && (
              <section style={{ marginBottom: "48px" }}>
                <h2 style={{ fontSize: "14px", fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "16px" }}>
                  Final Ad
                </h2>
                <div style={{ borderRadius: "12px", overflow: "hidden", border: "2px solid rgba(59,130,246,0.3)", backgroundColor: "#000000" }}>
                  <video src={finalVideoUrl} controls style={{ width: "100%", maxHeight: "480px", display: "block" }} />
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {/* ── Social Media Preview ── */}
      <SocialMediaPreview
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        campaignName={campaignName}
        subtitle={campaignData?.name || campaignName}
        images={imageUrls.map((url, i) => ({ id: String(i), label: `Image ${i + 1}`, previewUrl: url }))}
        videoUrl={videoUrl || undefined}
        audioUrl={jingleUrl || undefined}
      />

      {/* ── Lightbox ── */}
      {zoomedImage && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 50, backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          onClick={() => setZoomedImage(null)}
        >
          <img
            src={zoomedImage}
            alt="Zoomed view"
            style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: "12px", objectFit: "contain", boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setZoomedImage(null)}
            style={{ position: "absolute", top: "24px", right: "24px", width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.1)", border: "none", color: "#ffffff", fontSize: "20px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.2)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"; }}
            aria-label="Close lightbox"
          >
            &#x2715;
          </button>
        </div>
      )}
    </div>
  );
}
