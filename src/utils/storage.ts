import { SEED_ARTISTS, SEED_MOTIFS } from '../data/seedMotifs';
import type {
  ArtStyle,
  Artist,
  LicenseType,
  Mockup,
  Motif,
  ProductType,
  ProvenanceRecord,
  Remix,
} from '../types';
import { formatCreditLine } from './ethics';
import { formatMockupCredit } from './mockupCanvas';

const ARTISTS_KEY = 'farc_artists_v1';
const MOTIFS_KEY = 'farc_motifs_v1';
const REMIXES_KEY = 'farc_remixes_v1';
const MOCKUPS_KEY = 'farc_mockups_v1';
const PROVENANCE_KEY = 'farc_provenance_v1';

export const ART_STYLES: ArtStyle[] = [
  'Patachitra',
  'Alpona',
  'Kantha',
  'Kalighat',
  'Dokra',
  'Other',
];

export const LICENSE_META: Record<
  LicenseType,
  { label: string; shortLabel: string; description: string }
> = {
  remix_allowed: {
    label: 'Remix Allowed',
    shortLabel: 'Remix Allowed',
    description: 'Designers may generate AI variations and mockups; attribution stays attached.',
  },
  remix_with_credit: {
    label: 'Remix with Credit',
    shortLabel: 'Remix w/ Credit',
    description: 'AI variations and product mockups allowed with permanent artist credit and heritage note.',
  },
  not_allowed: {
    label: 'Not Allowed',
    shortLabel: 'Protected · No Remix',
    description: 'Archived for viewing and cultural education only. AI remixing is locked.',
  },
};

function generateShortRemixCode(existing: Remix[]): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const existingSet = new Set(existing.map((r) => r.shortCode?.toUpperCase()));
  for (let attempt = 0; attempt < 20; attempt++) {
    let suffix = '';
    for (let i = 0; i < 4; i++) {
      suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    const candidate = `RMX-${suffix}`;
    if (!existingSet.has(candidate)) {
      return candidate;
    }
  }
  return `RMX-${Date.now().toString(36).slice(-4).toUpperCase()}`;
}

export function loadArtists(): Artist[] {
  try {
    const raw = localStorage.getItem(ARTISTS_KEY);
    if (!raw) {
      localStorage.setItem(ARTISTS_KEY, JSON.stringify(SEED_ARTISTS));
      return SEED_ARTISTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(ARTISTS_KEY, JSON.stringify(SEED_ARTISTS));
      return SEED_ARTISTS;
    }
    const existingIds = new Set(parsed.map((a: Artist) => a.id));
    const missingSeeds = SEED_ARTISTS.filter((s) => !existingIds.has(s.id));
    if (missingSeeds.length > 0) {
      const merged = [...parsed, ...missingSeeds];
      localStorage.setItem(ARTISTS_KEY, JSON.stringify(merged));
      return merged;
    }
    return parsed;
  } catch {
    return SEED_ARTISTS;
  }
}

export function loadMotifs(): Motif[] {
  try {
    const raw = localStorage.getItem(MOTIFS_KEY);
    if (!raw) {
      localStorage.setItem(MOTIFS_KEY, JSON.stringify(SEED_MOTIFS));
      return SEED_MOTIFS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(MOTIFS_KEY, JSON.stringify(SEED_MOTIFS));
      return SEED_MOTIFS;
    }
    const existingIds = new Set(parsed.map((m: Motif) => m.id));
    const missingSeeds = SEED_MOTIFS.filter((s) => !existingIds.has(s.id));
    if (missingSeeds.length > 0) {
      const merged = [...parsed, ...missingSeeds];
      localStorage.setItem(MOTIFS_KEY, JSON.stringify(merged));
      return merged;
    }
    return parsed;
  } catch {
    return SEED_MOTIFS;
  }
}

export function loadRemixes(): Remix[] {
  try {
    const raw = localStorage.getItem(REMIXES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((r) => ({
      ...r,
      shortCode: r.shortCode || `RMX-${String(r.id).slice(-4).toUpperCase()}`,
    }));
  } catch {
    return [];
  }
}

export function loadMockups(): Mockup[] {
  try {
    const raw = localStorage.getItem(MOCKUPS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function loadProvenance(): ProvenanceRecord[] {
  try {
    const raw = localStorage.getItem(PROVENANCE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const remixes = loadRemixes();
    return parsed.map((p) => {
      const matchedRemix = remixes.find((r) => r.id === p.remixId);
      return {
        ...p,
        remixShortCode:
          p.remixShortCode ||
          matchedRemix?.shortCode ||
          `RMX-${String(p.remixId).slice(-4).toUpperCase()}`,
      };
    });
  } catch {
    return [];
  }
}

export function saveArtistAndMotif(
  artistInput: Omit<Artist, 'id' | 'createdAt'>,
  motifInput: Omit<Motif, 'id' | 'artistId' | 'createdAt'>,
): { artist: Artist; motif: Motif; allMotifs: Motif[] } {
  const existingArtists = loadArtists();
  const normalizedName = artistInput.name.trim().toLowerCase();

  let artist = existingArtists.find(
    (item) => item.name.trim().toLowerCase() === normalizedName,
  );

  if (!artist) {
    artist = {
      ...artistInput,
      id: `art_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(ARTISTS_KEY, JSON.stringify([artist, ...existingArtists]));
  } else {
    artist = {
      ...artist,
      region: artistInput.region || artist.region,
      contactOrHandle: artistInput.contactOrHandle || artist.contactOrHandle,
      upiId: artistInput.upiId || artist.upiId,
    };
    const updatedArtists = existingArtists.map((item) =>
      item.id === artist!.id ? artist! : item,
    );
    localStorage.setItem(ARTISTS_KEY, JSON.stringify(updatedArtists));
  }

  const motif: Motif = {
    ...motifInput,
    id: `mot_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    artistId: artist.id,
    createdAt: new Date().toISOString(),
  };

  const existingMotifs = loadMotifs();
  const allMotifs = [motif, ...existingMotifs];
  localStorage.setItem(MOTIFS_KEY, JSON.stringify(allMotifs));

  return { artist, motif, allMotifs };
}

export function saveRemixWithProvenance(params: {
  primaryMotif: Motif;
  secondaryMotif?: Motif | null;
  remixerName: string;
  variationType: Remix['variationType'];
  customPrompt: string;
  fullPromptUsed: string;
  resolution: Remix['resolution'];
  imageDataUrl: string;
  livingArtistWarningTriggered: boolean;
}): { remix: Remix; provenance: ProvenanceRecord; allRemixes: Remix[] } {
  if (params.primaryMotif.license === 'not_allowed') {
    throw new Error('Ethical License Guardrail: Cannot save a remix for a motif marked Not Allowed.');
  }
  if (params.secondaryMotif && params.secondaryMotif.license === 'not_allowed') {
    throw new Error('Ethical License Guardrail: Cannot blend with a motif marked Not Allowed.');
  }

  const existingRemixes = loadRemixes();
  const shortCode = generateShortRemixCode(existingRemixes);
  const now = new Date().toISOString();
  const creditLine = formatCreditLine(params.primaryMotif, params.secondaryMotif);
  const remixId = `rmx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const provenanceId = `prv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const certificateCode = `FARC-${new Date().getFullYear()}-${shortCode.replace('RMX-', '')}`;

  const remix: Remix = {
    id: remixId,
    shortCode,
    sourceMotifId: params.primaryMotif.id,
    secondaryMotifId: params.secondaryMotif?.id,
    remixerName: params.remixerName.trim(),
    variationType: params.variationType,
    customPrompt: params.customPrompt.trim(),
    fullPromptUsed: params.fullPromptUsed,
    resolution: params.resolution,
    imageDataUrl: params.imageDataUrl,
    livingArtistWarningTriggered: params.livingArtistWarningTriggered,
    creditLine,
    license: params.primaryMotif.license,
    createdAt: now,
  };

  const chain: ProvenanceRecord['chain'] = [
    {
      nodeId: params.primaryMotif.id,
      type: 'motif',
      label: `${params.primaryMotif.title} (${params.primaryMotif.artStyle})`,
      actorName: params.primaryMotif.artistName,
      timestamp: params.primaryMotif.createdAt,
    },
  ];

  if (params.secondaryMotif) {
    chain.push({
      nodeId: params.secondaryMotif.id,
      type: 'motif',
      label: `Blended: ${params.secondaryMotif.title} (${params.secondaryMotif.artStyle})`,
      actorName: params.secondaryMotif.artistName,
      timestamp: params.secondaryMotif.createdAt,
    });
  }

  chain.push({
    nodeId: remixId,
    type: 'remix',
    label: `AI Remix (${params.variationType.replace(/_/g, ' ')}) · ${shortCode}`,
    actorName: params.remixerName.trim(),
    timestamp: now,
  });

  const provenance: ProvenanceRecord = {
    id: provenanceId,
    certificateCode,
    remixShortCode: shortCode,
    rootMotifId: params.primaryMotif.id,
    secondaryMotifId: params.secondaryMotif?.id,
    artistName: params.primaryMotif.artistName,
    artStyle: params.primaryMotif.artStyle,
    remixId,
    chain,
    promptUsed: params.fullPromptUsed,
    license: params.primaryMotif.license,
    creditLine,
    createdAt: now,
  };

  const allRemixes = [remix, ...existingRemixes];
  localStorage.setItem(REMIXES_KEY, JSON.stringify(allRemixes));

  const existingProvenance = loadProvenance();
  localStorage.setItem(PROVENANCE_KEY, JSON.stringify([provenance, ...existingProvenance]));

  return { remix, provenance, allRemixes };
}

export function saveMockupWithProvenance(params: {
  remix: Remix;
  motif: Motif;
  creatorName: string;
  productType: ProductType;
  imageDataUrl: string;
  captionText?: string;
}): { mockup: Mockup; provenance: ProvenanceRecord; allMockups: Mockup[] } {
  if (params.motif.license === 'not_allowed') {
    throw new Error('Ethical License Guardrail: Cannot create product mockups for a protected motif.');
  }

  const now = new Date().toISOString();
  const mockupId = `mkp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const remixIdentifier = params.remix.shortCode || params.remix.id;
  const lockedCreditText = formatMockupCredit({
    artistName: params.motif.artistName,
    artStyle: params.motif.artStyle,
    remixId: remixIdentifier,
  });

  const mockup: Mockup = {
    id: mockupId,
    remixId: params.remix.id,
    sourceMotifId: params.motif.id,
    creatorName: params.creatorName.trim() || params.remix.remixerName,
    productType: params.productType,
    imageDataUrl: params.imageDataUrl,
    lockedCreditText,
    captionText: params.captionText?.trim() || undefined,
    createdAt: now,
  };

  const existingMockups = loadMockups();
  const allMockups = [mockup, ...existingMockups];
  localStorage.setItem(MOCKUPS_KEY, JSON.stringify(allMockups));

  const existingProvenance = loadProvenance();
  const unlinkedRecord = existingProvenance.find(
    (record) => record.remixId === params.remix.id && !record.mockupId,
  );

  let savedProvenance: ProvenanceRecord;
  let updatedProvenance: ProvenanceRecord[];

  const mockupNode = {
    nodeId: mockupId,
    type: 'mockup' as const,
    label: `Product Mockup (${params.productType.replace(/_/g, ' ')})`,
    actorName: mockup.creatorName,
    timestamp: now,
  };

  if (unlinkedRecord) {
    savedProvenance = {
      ...unlinkedRecord,
      mockupId,
      chain: [...unlinkedRecord.chain, mockupNode],
    };
    updatedProvenance = existingProvenance.map((record) =>
      record.id === unlinkedRecord.id ? savedProvenance : record,
    );
  } else {
    const baseRecord = existingProvenance.find((r) => r.remixId === params.remix.id);
    const baseChain = baseRecord
      ? baseRecord.chain.filter((n) => n.type !== 'mockup')
      : [
          {
            nodeId: params.motif.id,
            type: 'motif' as const,
            label: `${params.motif.title} (${params.motif.artStyle})`,
            actorName: params.motif.artistName,
            timestamp: params.motif.createdAt,
          },
          {
            nodeId: params.remix.id,
            type: 'remix' as const,
            label: `AI Remix (${params.remix.variationType.replace(/_/g, ' ')}) · ${remixIdentifier}`,
            actorName: params.remix.remixerName,
            timestamp: params.remix.createdAt,
          },
        ];

    const certSuffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    savedProvenance = {
      id: `prv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      certificateCode: `FARC-${new Date().getFullYear()}-${certSuffix}`,
      remixShortCode: remixIdentifier,
      rootMotifId: params.motif.id,
      secondaryMotifId: params.remix.secondaryMotifId,
      artistName: params.motif.artistName,
      artStyle: params.motif.artStyle,
      remixId: params.remix.id,
      mockupId,
      chain: [...baseChain, mockupNode],
      promptUsed: params.remix.fullPromptUsed,
      license: params.motif.license,
      creditLine: params.remix.creditLine,
      createdAt: now,
    };
    updatedProvenance = [savedProvenance, ...existingProvenance];
  }

  localStorage.setItem(PROVENANCE_KEY, JSON.stringify(updatedProvenance));

  return { mockup, provenance: savedProvenance, allMockups };
}

export function findProvenanceById(
  query: string,
  records: ProvenanceRecord[],
): ProvenanceRecord | null {
  const needle = query.trim().toLowerCase();
  if (!needle) return null;
  return (
    records.find(
      (r) =>
        r.remixShortCode.toLowerCase() === needle ||
        r.certificateCode.toLowerCase() === needle ||
        r.remixId.toLowerCase() === needle ||
        r.id.toLowerCase() === needle ||
        (r.mockupId && r.mockupId.toLowerCase() === needle),
    ) ?? null
  );
}

export function updateMotifLicense(
  motifId: string,
  newLicense: LicenseType,
): Motif[] {
  const existingMotifs = loadMotifs();
  const updatedMotifs = existingMotifs.map((motif) =>
    motif.id === motifId ? { ...motif, license: newLicense } : motif,
  );
  localStorage.setItem(MOTIFS_KEY, JSON.stringify(updatedMotifs));
  return updatedMotifs;
}

export function resetArchiveToDemo(): Motif[] {
  localStorage.setItem(ARTISTS_KEY, JSON.stringify(SEED_ARTISTS));
  localStorage.setItem(MOTIFS_KEY, JSON.stringify(SEED_MOTIFS));
  return SEED_MOTIFS;
}

export async function fileToOptimizedDataUrl(file: File, maxDim = 1024): Promise<string> {
  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read uploaded image file.'));
    reader.readAsDataURL(file);
  });

  return compressDataUrl(rawDataUrl, maxDim);
}

export async function compressDataUrl(dataUrl: string, maxDim = 900): Promise<string> {
  return new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.84));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export async function ensureImageDataUrl(src: string): Promise<string> {
  if (src.startsWith('data:')) {
    return src;
  }
  const response = await fetch(src);
  if (!response.ok) {
    throw new Error('Could not load motif image data for remixing.');
  }
  const blob = await response.blob();
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to encode motif image.'));
    reader.readAsDataURL(blob);
  });
  return compressDataUrl(dataUrl, 1024);
}
