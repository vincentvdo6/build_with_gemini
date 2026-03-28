import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CampaignDraft, CampaignSettings, CampaignTone } from "@/types/campaign";

const DEFAULT_SETTINGS: CampaignSettings = {
  imageCount: 4,
  aspectRatio: "16:9",
  videoDuration: 30,
  videoStyle: "cinematic",
  musicGenre: "upbeat-pop",
};

const DEFAULT_TONE: CampaignTone = { playful: 50, modern: 50 };

interface CampaignDraftStore extends CampaignDraft {
  setStep: (step: CampaignDraft["step"]) => void;
  setProductImages: (images: CampaignDraft["productImages"]) => void;
  setLogo: (logo: CampaignDraft["logo"]) => void;
  setPrompt: (prompt: string) => void;
  setTone: (tone: Partial<CampaignTone>) => void;
  setSettings: (settings: Partial<CampaignSettings>) => void;
  reset: () => void;
}

const INITIAL: CampaignDraft = {
  step: 1,
  productImages: [],
  logo: null,
  prompt: "",
  tone: DEFAULT_TONE,
  settings: DEFAULT_SETTINGS,
};

export const useCampaignDraftStore = create<CampaignDraftStore>()(
  persist(
    (set) => ({
      ...INITIAL,
      setStep: (step) => set({ step }),
      setProductImages: (productImages) => set({ productImages }),
      setLogo: (logo) => set({ logo }),
      setPrompt: (prompt) => set({ prompt }),
      setTone: (tone) =>
        set((s) => ({ tone: { ...s.tone, ...tone } })),
      setSettings: (settings) =>
        set((s) => ({ settings: { ...s.settings, ...settings } })),
      reset: () => set(INITIAL),
    }),
    { name: "campaign-draft" }
  )
);
