export interface Brand {
  id: string;
  name: string;
  logoAssetId?: string;
  logoPreviewUrl?: string;
  toneKeywords: string[]; // e.g. ["playful", "modern", "bold"]
}

export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  brand?: Brand;
  createdAt: string;
}
