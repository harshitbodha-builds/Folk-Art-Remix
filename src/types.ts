export type ArtStyle =
  | 'Patachitra'
  | 'Alpona'
  | 'Kantha'
  | 'Kalighat'
  | 'Dokra'
  | 'Other';

export type LicenseType =
  | 'remix_allowed'
  | 'remix_with_credit'
  | 'not_allowed';

export type VariationType =
  | 'color_palette'
  | 'pattern_tiling'
  | 'simplified_modern'
  | 'mix_second_motif'
  | 'mood_shift';

export type ProductType =
  | 'tshirt'
  | 'tote_bag'
  | 'saree_border'
  | 'mug'
  | 'poster'
  | 'phone_case';

export interface DominantColor {
  name: string;
  hex: string;
}

export interface Artist {
  id: string;
  name: string;
  region: string;
  primaryStyle: ArtStyle;
  contactOrHandle?: string;
  upiId?: string;
  createdAt: string;
}

export interface Motif {
  id: string;
  artistId: string;
  artistName: string;
  contactOrHandle?: string;
  upiId?: string;
  title: string;
  artStyle: ArtStyle;
  region: string;
  imageDataUrl: string;
  story: string;
  motifDescription: string;
  detectedStyle: string;
  dominantColors: DominantColor[];
  culturalNote: string;
  license: LicenseType;
  consentConfirmed: boolean;
  isDemo?: boolean;
  createdAt: string;
}

export interface MotifAnalysisResult {
  motifDescription: string;
  detectedStyle: string;
  dominantColors: DominantColor[];
  culturalNote: string;
}

export interface Remix {
  id: string;
  shortCode: string;
  sourceMotifId: string;
  secondaryMotifId?: string;
  parentRemixId?: string;
  remixerName: string;
  variationType: VariationType;
  customPrompt: string;
  fullPromptUsed: string;
  resolution: '1K' | '2K' | '4K';
  imageDataUrl: string;
  livingArtistWarningTriggered: boolean;
  creditLine: string;
  license: LicenseType;
  createdAt: string;
}

export interface Mockup {
  id: string;
  remixId: string;
  sourceMotifId: string;
  creatorName: string;
  productType: ProductType;
  imageDataUrl: string;
  lockedCreditText: string;
  captionText?: string;
  createdAt: string;
}

export interface ProvenanceNode {
  nodeId: string;
  type: 'motif' | 'remix' | 'mockup';
  label: string;
  actorName: string;
  timestamp: string;
}

export interface ProvenanceRecord {
  id: string;
  certificateCode: string;
  remixShortCode: string;
  rootMotifId: string;
  secondaryMotifId?: string;
  artistName: string;
  artStyle: ArtStyle;
  remixId: string;
  mockupId?: string;
  chain: ProvenanceNode[];
  promptUsed: string;
  license: LicenseType;
  creditLine: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}
