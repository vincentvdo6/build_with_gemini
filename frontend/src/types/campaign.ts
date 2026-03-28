export type AIModel = "imagen" | "veo" | "lyria";

export type CampaignStatus = "pending" | "processing" | "completed" | "partial" | "failed";
export type JobStatus = "queued" | "running" | "completed" | "failed" | "retrying";

export interface Asset {
  id: string;
  gcsPath: string;
  previewUrl: string; // signed GCS URL
  mimeType: string;
  sizeBytes: number;
  role: "product_image" | "logo" | "generated_image" | "generated_video" | "generated_audio";
}

export interface CampaignTone {
  playful: number;   // 0–100
  modern: number;    // 0–100
}

export interface CampaignSettings {
  imageCount: 1 | 2 | 3 | 4 | 6;
  aspectRatio: "1:1" | "16:9" | "9:16";
  videoDuration: 15 | 30 | 60;
  videoStyle: "cinematic" | "animated" | "live-action";
  musicGenre: "upbeat-pop" | "orchestral" | "lo-fi" | "custom";
  musicCustomPrompt?: string;
}

export interface AIJob {
  id: string;
  model: AIModel;
  status: JobStatus;
  progress: number; // 0–100
  errorMsg?: string;
}

export interface Campaign {
  id: string;
  name?: string;
  prompt: string;
  tone: CampaignTone;
  settings: CampaignSettings;
  status: CampaignStatus;
  createdAt: string;
  completedAt?: string;
  inputAssets: Asset[];
  jobs: AIJob[];
}

export interface CampaignResults {
  campaignId: string;
  images: Asset[];      // Imagen outputs
  video: Asset | null;  // Veo .mp4
  jingle: Asset | null; // Lyria .mp3
}

// SSE event payload
export interface ProgressEvent {
  model: AIModel;
  status: JobStatus;
  progress: number;
  assetUrl?: string;
  message?: string;
}

// Wizard draft (stored in Zustand)
export interface CampaignDraft {
  step: 1 | 2 | 3 | 4;
  productImages: Pick<Asset, "id" | "previewUrl">[];
  logo: Pick<Asset, "id" | "previewUrl"> | null;
  prompt: string;
  tone: CampaignTone;
  settings: CampaignSettings;
}
