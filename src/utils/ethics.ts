import type { Motif, VariationType } from '../types';

export interface VariationOptionMeta {
  id: VariationType;
  label: string;
  shortDesc: string;
  instruction: string;
  angles: string[];
}

export const VARIATION_OPTIONS: VariationOptionMeta[] = [
  {
    id: 'color_palette',
    label: 'Color Palette Shift',
    shortDesc: 'Reimagine natural mineral pigments while keeping every line and motif intact.',
    instruction:
      'Keep the exact composition, border geometry, and traditional linework of the original motif, while transforming the pigment palette.',
    angles: [
      'Deep Bengal indigo, bone ivory, and muted antique brass accents.',
      'Festive Kolkata vermilion sindoor red, turmeric gold, and lampblack ink.',
      'Monsoon forest sage, raw tussar cream, and burnt laterite terracotta.',
      'Twilight charcoal slate, moonlit chalk white, and warm copper ochre.',
    ],
  },
  {
    id: 'pattern_tiling',
    label: 'Pattern Tiling',
    shortDesc: 'Arrange the motif into a seamless repeating textile or border composition.',
    instruction:
      'Adapt the original folk motif into a balanced, edge-to-edge repeating textile pattern with harmonious spacing and corner rhythm.',
    angles: [
      'Dense all-over block-print repeat with rhythmic floral connectors.',
      'Horizontal saree-border frieze repeat framed by twin folk scalloped edges.',
      'Half-drop diamond lattice repeat preserving the central focal icon.',
      'Minimalist spaced scatter repeat on natural handloom cotton ground.',
    ],
  },
  {
    id: 'simplified_modern',
    label: 'Modern / Simplified',
    shortDesc: 'Distill intricate details into bold contemporary graphic forms without losing heritage.',
    instruction:
      'Distill the original artwork into clean, contemporary graphic linework and flat balanced shapes while keeping its cultural silhouette unmistakable.',
    angles: [
      'Two-tone archival woodblock aesthetic with bold confident contours.',
      'Clean editorial line-art study with generous negative space and crisp geometry.',
      'Flat screen-print poster reduction using three harmonious heritage tones.',
      'Refined fine-line monogram adaptation suited for modern stationery and craft labels.',
    ],
  },
  {
    id: 'mix_second_motif',
    label: 'Mix with Second Motif',
    shortDesc: 'Blend elements from a second licensed folk motif into a unified composition.',
    instruction:
      'Harmoniously fuse the central subject of the primary motif with the border grammar, rhythmic brushwork, or background patterning of the second reference motif.',
    angles: [
      'Primary central motif framed inside the secondary motif’s traditional border language.',
      'Interwoven botanical and geometric dialogue uniting both regional folk traditions equally.',
      'Primary iconography rendered using the secondary motif’s texture and stitch/brush cadence.',
      'Symmetrical folk medallion pairing emblems from both motifs in balanced harmony.',
    ],
  },
  {
    id: 'mood_shift',
    label: 'Mood & Atmosphere',
    shortDesc: 'Shift tonal warmth, contrast, and seasonal storytelling mood.',
    instruction:
      'Preserve the traditional folk motifs and hand-drawn contours while transforming the tonal mood, contrast, and seasonal atmosphere.',
    angles: [
      'Serene dawn mist mood with soft washed mineral tints and delicate linework.',
      'High-drama nocturnal storytelling mood with deep indigo ground and luminous highlights.',
      'Sun-baked terracotta afternoon mood with warm earthy contrast and rustic paper grain.',
      'Quiet meditative monochrome sepia ink study honoring archival scroll drawings.',
    ],
  },
];

export const REMIX_PROMPT_TEMPLATE = `You are an ethical craft collaborator adapting a traditional {{artStyle}} motif from {{region}}, originally created by artisan {{artistName}} ("{{title}}").

CULTURAL & VISUAL PRESERVATION RULES (MANDATORY):
1. Preserve the recognizable cultural iconography, symbolic proportions, and traditional line-art rhythm of the original artwork: {{motifDescription}}.
2. Maintain authentic {{artStyle}} hand-crafted stroke weights, contour clarity, and folk ornament vocabulary rather than turning it into generic glossy 3D or photorealistic CGI.
3. Cultural context to honor: {{culturalNote}}

VARIATION OBJECTIVE ({{variationLabel}}):
{{variationInstruction}}
{{secondaryMotifSection}}
USER CREATIVE DIRECTION:
{{customPromptOrDefault}}

VARIANT ANGLE ({{variantIndex}} of {{totalCount}}):
{{variantAngleInstruction}}

Output a crisp, museum-grade 2D flat artwork suitable for ethical textile or print adaptation, with clean edges and zero watermarks or text overlays.`;

export function buildRemixPrompt(params: {
  primaryMotif: Motif;
  secondaryMotif?: Motif | null;
  variationType: VariationType;
  customPrompt: string;
  variantIndex: number;
  totalCount: number;
}): string {
  const option =
    VARIATION_OPTIONS.find((opt) => opt.id === params.variationType) ?? VARIATION_OPTIONS[0];
  const angle = option.angles[(params.variantIndex - 1) % option.angles.length];

  const secondarySection =
    params.variationType === 'mix_second_motif' && params.secondaryMotif
      ? `\nSECOND REFERENCE MOTIF TO BLEND:\n- Title: "${params.secondaryMotif.title}" (${params.secondaryMotif.artStyle} from ${params.secondaryMotif.region}, by ${params.secondaryMotif.artistName})\n- Visual character: ${params.secondaryMotif.motifDescription || params.secondaryMotif.story}\n`
      : '';

  return REMIX_PROMPT_TEMPLATE.replace(/\{\{artStyle\}\}/g, params.primaryMotif.artStyle)
    .replace(/\{\{region\}\}/g, params.primaryMotif.region)
    .replace(/\{\{artistName\}\}/g, params.primaryMotif.artistName)
    .replace(/\{\{title\}\}/g, params.primaryMotif.title)
    .replace(
      /\{\{motifDescription\}\}/g,
      params.primaryMotif.motifDescription || params.primaryMotif.story,
    )
    .replace(
      /\{\{culturalNote\}\}/g,
      params.primaryMotif.culturalNote || params.primaryMotif.story,
    )
    .replace(/\{\{variationLabel\}\}/g, option.label)
    .replace(/\{\{variationInstruction\}\}/g, option.instruction)
    .replace(/\{\{secondaryMotifSection\}\}/g, secondarySection)
    .replace(
      /\{\{customPromptOrDefault\}\}/g,
      params.customPrompt.trim() || 'Stay faithful to traditional artisan balance and hand-painted warmth.',
    )
    .replace(/\{\{variantIndex\}\}/g, String(params.variantIndex))
    .replace(/\{\{totalCount\}\}/g, String(params.totalCount))
    .replace(/\{\{variantAngleInstruction\}\}/g, angle);
}

export function formatCreditLine(primary: Motif, secondary?: Motif | null): string {
  if (secondary && secondary.id !== primary.id) {
    return `Inspired by ${primary.artistName} (${primary.artStyle}) & ${secondary.artistName} (${secondary.artStyle})`;
  }
  return `Inspired by ${primary.artistName}, ${primary.artStyle}`;
}

const IMITATION_PHRASES = [
  'in the style of',
  'in style of',
  'by artist',
  'imitate',
  'mimic',
  'copy ',
  'like ',
  'painting by',
  'artwork by',
  'signature of',
];

const KNOWN_ARTIST_NAMES = [
  'jamini roy',
  'ganesh pyne',
  'bikash bhattacharjee',
  'jogen chowdhury',
  'paresh maity',
  'suvaprasanna',
  'bharti kher',
  'subodh gupta',
  'manjit bawa',
  'manu parekh',
  'ramkinkar baij',
  'nandalal bose',
  'abenindranath',
  'abanindranath',
  'rabindranath',
  'anwar chitrakar',
  'manu chitrakar',
  'moyna chitrakar',
  'dulari devi',
  'bhajju shyam',
  'jangu shyam',
];

export function checkLivingArtistImitation(
  promptText: string,
  allowedArtistNames: string[] = [],
): { flagged: boolean; reason?: string } {
  const lower = promptText.toLowerCase().trim();
  if (!lower) return { flagged: false };

  const allowedLower = allowedArtistNames.map((n) => n.toLowerCase().trim()).filter(Boolean);

  for (const artist of KNOWN_ARTIST_NAMES) {
    if (lower.includes(artist) && !allowedLower.some((a) => a.includes(artist))) {
      return {
        flagged: true,
        reason: `Your prompt references a named artist ("${artist}"). Avoid imitating named living or modern artists without explicit consent.`,
      };
    }
  }

  for (const phrase of IMITATION_PHRASES) {
    const idx = lower.indexOf(phrase);
    if (idx !== -1) {
      const trailing = lower.slice(idx + phrase.length).trim();
      const firstWords = trailing.split(/\s+/).slice(0, 2).join(' ');
      const referencesUploadedArtist = allowedLower.some((name) =>
        trailing.startsWith(name),
      );
      if (firstWords.length > 2 && !referencesUploadedArtist) {
        return {
          flagged: true,
          reason:
            'Your prompt appears to request imitating a specific named artist ("' +
            phrase.trim() +
            ' ..."). Please describe visual traits, colors, or regional folk styles instead of imitating an individual artist without consent.',
        };
      }
    }
  }

  return { flagged: false };
}
