"use client";

import { useRef, useState } from "react";

interface NewCampaignModalProps {
  onClose: () => void;
  onGenerate: (data: { businessName: string; productName: string; files: File[]; logo: File | null; imageCount: number }) => void;
}

export default function NewCampaignModal({ onClose, onGenerate }: NewCampaignModalProps) {
  const [businessName, setBusinessName] = useState("");
  const [productName, setProductName] = useState("");
  const [imageCount, setImageCount] = useState(3);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  function handleFiles(newFiles: FileList | null) {
    if (!newFiles) return;
    const added = Array.from(newFiles).filter((f) => f.type.startsWith("image/"));
    setFiles((prev) => [...prev, ...added]);
    added.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (e) => setPreviews((prev) => [...prev, e.target?.result as string]);
      reader.readAsDataURL(f);
    });
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  function handleLogo(fileList: FileList | null) {
    if (!fileList || !fileList[0]) return;
    const f = fileList[0];
    setLogo(f);
    const reader = new FileReader();
    reader.onload = (e) => setLogoPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }

  const hasPhotos = previews.length > 0;

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

          {/* Product Photos */}
          <div
            className="flex flex-col gap-3"
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleFiles(e.dataTransfer.files); }}
          >
            <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest">
              Product Photos
            </p>

            {!hasPhotos ? (
              /* Empty state — full drop zone */
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
                <p className="text-xs text-white/30">PNG, JPG, WEBP</p>
              </div>
            ) : (
              /* Photos grid — thumbnails ARE the upload area */
              <>
                <div className="grid grid-cols-4 gap-2">
                  {previews.map((src, i) => (
                    <div
                      key={i}
                      className="relative group aspect-square rounded-xl border border-white/10 bg-white/5 overflow-hidden"
                    >
                      <img src={src} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeFile(i)}
                        className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/70 text-white/80 hover:text-white hover:bg-black/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Remove"
                      >
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  {/* Add more tile */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-white/10 bg-white/[0.02] hover:border-white/20 transition-colors flex flex-col items-center justify-center cursor-pointer gap-1"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-white/30">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span className="text-[10px] text-white/30">Add more</span>
                  </div>
                </div>
                <p className="text-xs text-white/30">
                  {previews.length} photo{previews.length !== 1 ? "s" : ""} uploaded. More angles help AI place your product accurately.
                </p>
              </>
            )}

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
            />
          </div>

          {/* Logo — separated */}
          <div className="flex flex-col gap-3 border-t border-white/[0.06] pt-5">
            <div className="flex items-center gap-2">
              <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest">
                Logo
              </p>
              <span className="text-[10px] text-white/20">Optional</span>
            </div>
            <div className="flex items-center gap-3">
              <div
                onClick={() => logoInputRef.current?.click()}
                className="w-14 h-14 rounded-xl border border-dashed border-white/10 bg-white/[0.02] hover:border-white/20 transition-colors flex items-center justify-center cursor-pointer overflow-hidden flex-shrink-0"
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-1" />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-white/20">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                )}
              </div>
              <p className="text-xs text-white/25">PNG or SVG with transparent background works best</p>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/svg+xml,image/webp"
                className="hidden"
                onChange={(e) => { handleLogo(e.target.files); e.target.value = ""; }}
              />
            </div>
          </div>

          {/* Image count slider */}
          <div className="flex flex-col gap-3 border-t border-white/[0.06] pt-5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest">
                Campaign images
              </p>
              <span className="text-sm font-bold text-white">{imageCount}</span>
            </div>
            <input
              type="range"
              min={2}
              max={5}
              step={1}
              value={imageCount}
              onChange={(e) => setImageCount(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-white/10 accent-blue-500"
            />
            <div className="flex justify-between text-[10px] text-white/20 px-0.5">
              <span>2 — faster</span>
              <span>5 — more variety</span>
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
            disabled={files.length === 0}
            onClick={() => files.length > 0 && onGenerate({ businessName, productName, files, logo, imageCount })}
            className={[
              "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors",
              files.length > 0
                ? "text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/40"
                : "text-white/30 bg-white/10 cursor-not-allowed",
            ].join(" ")}
          >
            {files.length === 0 ? "Add photos to continue" : "Generate"}
          </button>
        </div>
      </div>
    </div>
  );
}
