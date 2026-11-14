import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import type { Motif, ProvenanceRecord, Remix, VariationType } from '../types';
import {
  VARIATION_OPTIONS,
  buildRemixPrompt,
  checkLivingArtistImitation,
  formatCreditLine,
} from '../utils/ethics';
import {
  LICENSE_META,
  compressDataUrl,
  ensureImageDataUrl,
  saveRemixWithProvenance,
} from '../utils/storage';

interface GeneratedVariation {
  id: string;
  angleLabel: string;
  promptUsed: string;
  imageDataUrl: string;
}

interface RemixStudioPageProps {
  motifs: Motif[];
  selectedMotifId: string | null;
  remixes: Remix[];
  onSelectMotif: (motifId: string) => void;
  onRemixSaved: (remix: Remix, provenance: ProvenanceRecord) => void;
  onOpenMockup: (remixId: string) => void;
  onOpenProvenanceByRemix: (remixId: string) => void;
  onBackToLibrary: () => void;
}

export const RemixStudioPage: React.FC<RemixStudioPageProps> = ({
  motifs,
  selectedMotifId,
  remixes,
  onSelectMotif,
  onRemixSaved,
  onOpenMockup,
  onOpenProvenanceByRemix,
  onBackToLibrary,
}) => {
  const activeMotif = useMemo(
    () => motifs.find((m) => m.id === selectedMotifId) ?? motifs[0] ?? null,
    [motifs, selectedMotifId],
  );

  const [acknowledgedCulturalNote, setAcknowledgedCulturalNote] = useState(false);
  const [variationType, setVariationType] = useState<VariationType>('color_palette');
  const [secondaryMotifId, setSecondaryMotifId] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [remixerName, setRemixerName] = useState('Studio Kolkata');
  const [resolution, setResolution] = useState<'1K' | '2K' | '4K'>('1K');
  const [variationCount, setVariationCount] = useState<3 | 4>(3);
  const [showTemplate, setShowTemplate] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generateWarning, setGenerateWarning] = useState<string | null>(null);
  const [generatedVariations, setGeneratedVariations] = useState<GeneratedVariation[]>([]);
  const [savedVariationIds, setSavedVariationIds] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setAcknowledgedCulturalNote(false);
    setGeneratedVariations([]);
    setGenerateError(null);
    setGenerateWarning(null);
    setSavedVariationIds({});
    setSaveError(null);
  }, [activeMotif?.id]);

  const remixableSecondaryMotifs = useMemo(() => {
    if (!activeMotif) return [];
    return motifs.filter(
      (m) => m.id !== activeMotif.id && m.license !== 'not_allowed',
    );
  }, [motifs, activeMotif]);

  const secondaryMotif = useMemo(() => {
    if (variationType !== 'mix_second_motif') return null;
    return (
      remixableSecondaryMotifs.find((m) => m.id === secondaryMotifId) ??
      remixableSecondaryMotifs[0] ??
      null
    );
  }, [variationType, remixableSecondaryMotifs, secondaryMotifId]);

  const livingArtistCheck = useMemo(() => {
    if (!activeMotif) return { flagged: false };
    return checkLivingArtistImitation(customPrompt, [
      activeMotif.artistName,
      secondaryMotif?.artistName ?? '',
    ]);
  }, [customPrompt, activeMotif, secondaryMotif]);

  const previewPrompt = useMemo(() => {
    if (!activeMotif) return '';
    return buildRemixPrompt({
      primaryMotif: activeMotif,
      secondaryMotif,
      variationType,
      customPrompt,
      variantIndex: 1,
      totalCount: variationCount,
    });
  }, [activeMotif, secondaryMotif, variationType, customPrompt, variationCount]);

  const motifSavedRemixes = useMemo(() => {
    if (!activeMotif) return [];
    return remixes.filter(
      (r) =>
        r.sourceMotifId === activeMotif.id || r.secondaryMotifId === activeMotif.id,
    );
  }, [remixes, activeMotif]);

  if (!activeMotif) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-16 text-center space-y-4">
        <p className="font-serif text-2xl text-[#1C1917]">No motifs available in the archive</p>
        <button
          type="button"
          onClick={onBackToLibrary}
          className="px-4 py-2 text-sm font-medium text-white bg-[#9A3412] rounded-md cursor-pointer"
        >
          Return to Motif Library
        </button>
      </div>
    );
  }

  const isBlocked = activeMotif.license === 'not_allowed';
  const creditPreview = formatCreditLine(activeMotif, secondaryMotif);

  const handleGenerate = async () => {
    if (isBlocked || !acknowledgedCulturalNote) return;

    setIsGenerating(true);
    setGenerateError(null);
    setGenerateWarning(null);
    setSaveError(null);

    try {
      const primaryImageBase64 = await ensureImageDataUrl(activeMotif.imageDataUrl);
      const secondaryImageBase64 =
        variationType === 'mix_second_motif' && secondaryMotif
          ? await ensureImageDataUrl(secondaryMotif.imageDataUrl)
          : undefined;

      const selectedOption =
        VARIATION_OPTIONS.find((opt) => opt.id === variationType) ?? VARIATION_OPTIONS[0];

      const prompts = Array.from({ length: variationCount }, (_, idx) => ({
        angleLabel: selectedOption.angles[idx % selectedOption.angles.length],
        prompt: buildRemixPrompt({
          primaryMotif: activeMotif,
          secondaryMotif,
          variationType,
          customPrompt,
          variantIndex: idx + 1,
          totalCount: variationCount,
        }),
      }));

      const response = await fetch('/api/gemini/generate-remix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryImageBase64,
          secondaryImageBase64,
          license: activeMotif.license,
          secondaryLicense: secondaryMotif?.license,
          resolution,
          prompts,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Gemini failed to generate motif variations.');
      }

      setGeneratedVariations(Array.isArray(payload.variations) ? payload.variations : []);
      if (payload.warning) {
        setGenerateWarning(payload.warning);
      }
      setSavedVariationIds({});
    } catch (err) {
      setGenerateError(
        err instanceof Error
          ? err.message
          : 'Unexpected error while generating variations.',
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveVariation = async (variation: GeneratedVariation) => {
    setSaveError(null);
    if (!remixerName.trim()) {
      setSaveError('Please enter your name or studio handle before saving a remix.');
      return;
    }

    try {
      const storedImage = await compressDataUrl(variation.imageDataUrl, 900);
      const { remix, provenance } = saveRemixWithProvenance({
        primaryMotif: activeMotif,
        secondaryMotif,
        remixerName: remixerName.trim(),
        variationType,
        customPrompt,
        fullPromptUsed: variation.promptUsed,
        resolution,
        imageDataUrl: storedImage,
        livingArtistWarningTriggered: livingArtistCheck.flagged,
      });

      setSavedVariationIds((prev) => ({
        ...prev,
        [variation.id]: provenance.certificateCode,
      }));
      onRemixSaved(remix, provenance);
    } catch (err) {
      setSaveError(
        err instanceof Error
          ? err.message
          : 'Could not save remix to local storage.',
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
      <div className="pb-6 border-b border-[#E5DEC9] flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-2">
          <button
            type="button"
            onClick={onBackToLibrary}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#57534E] hover:text-[#1C1917] cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            Back to Motif Library
          </button>
          <h1 className="font-serif text-3xl lg:text-4xl font-medium text-[#1C1917]">
            Ethical Remix Studio
          </h1>
          <p className="text-sm text-[#44403C] max-w-2xl">
            Read the motif’s cultural meaning, select a respectful variation direction, and save your
            chosen output with a permanent parent link to the original artist.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <label
            htmlFor="motif-switcher"
            className="text-xs font-medium text-[#57534E] whitespace-nowrap"
          >
            Active Motif:
          </label>
          <select
            id="motif-switcher"
            value={activeMotif.id}
            onChange={(e) => onSelectMotif(e.target.value)}
            className="px-3 py-2 text-sm bg-white border border-[#D6CEBE] rounded-md text-[#1C1917] focus:outline-none focus:border-[#9A3412] cursor-pointer max-w-xs"
          >
            {motifs.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title} — {m.artistName} ({LICENSE_META[m.license].shortLabel})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Step 1: Cultural Note & License Gate (Always Visible First) */}
      <section className="bg-white border border-[#E5DEC9] rounded-lg p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4 space-y-3">
          <div className="aspect-square bg-[#EBE6DF] border border-[#E5DEC9] rounded-md overflow-hidden">
            <img
              src={activeMotif.imageDataUrl}
              alt={`${activeMotif.title} by ${activeMotif.artistName}`}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="text-xs text-[#57534E] flex items-center justify-between gap-2">
            <span>{activeMotif.artStyle} · {activeMotif.region}</span>
            <span className="font-mono">{activeMotif.id}</span>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-5">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-widest text-[#78716C] font-medium">
              Step 1 · Cultural Meaning & License Check
            </p>
            <h2 className="font-serif text-2xl lg:text-3xl font-medium text-[#1C1917]">
              {activeMotif.title}
            </h2>
            <p className="text-sm text-[#44403C]">
              Original Artist:{' '}
              <span className="font-semibold text-[#1C1917]">{activeMotif.artistName}</span>
              {activeMotif.contactOrHandle && (
                <span className="text-[#78716C]"> · {activeMotif.contactOrHandle}</span>
              )}
            </p>
          </div>

          <div className="p-4 bg-[#FBF9F5] border border-[#E5DEC9] rounded-md space-y-2">
            <h3 className="text-xs uppercase tracking-widest text-[#9A3412] font-semibold">
              Cultural Note (Read Before Remixing)
            </h3>
            <p className="font-serif text-base italic text-[#1C1917] whitespace-pre-line leading-relaxed">
              {activeMotif.culturalNote || activeMotif.story}
            </p>
            {activeMotif.culturalNote && (
              <p className="text-xs text-[#57534E] pt-1 leading-relaxed">
                <strong className="font-medium text-[#1C1917]">Artisan Story:</strong>{' '}
                {activeMotif.story}
              </p>
            )}
          </div>

          {isBlocked ? (
            <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-md space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#991B1B]">
                <Lock className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Remixing Blocked — Artist License: Not Allowed</span>
              </div>
              <p className="text-xs text-[#7F1D1D] leading-relaxed">
                {activeMotif.artistName} has archived this motif for cultural education and viewing
                only. AI remix generation is disabled in code to respect the artist’s consent terms.
              </p>
              <button
                type="button"
                onClick={() => {
                  const firstRemixable = motifs.find((m) => m.license !== 'not_allowed');
                  if (firstRemixable) onSelectMotif(firstRemixable.id);
                }}
                className="mt-1 px-3 py-1.5 text-xs font-medium text-[#991B1B] bg-white border border-[#FCA5A5] hover:bg-[#FEE2E2] rounded-md cursor-pointer"
              >
                Switch to a Remixable Motif
              </button>
            </div>
          ) : (
            <div className="p-4 bg-[#F7F4EE] border border-[#E5DEC9] rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#1C1917]">
                  <ShieldCheck className="w-4 h-4 text-[#9A3412]" aria-hidden="true" />
                  <span>License: {LICENSE_META[activeMotif.license].label}</span>
                </div>
                <p className="text-xs text-[#57534E]">
                  Required permanent credit:{' '}
                  <span className="font-medium text-[#1C1917]">“{creditPreview}”</span>
                </p>
              </div>

              <label className="inline-flex items-center gap-2.5 px-3.5 py-2 bg-white border border-[#D6CEBE] rounded-md cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={acknowledgedCulturalNote}
                  onChange={(e) => setAcknowledgedCulturalNote(e.target.checked)}
                  className="accent-[#9A3412] w-4 h-4"
                />
                <span className="text-xs font-medium text-[#1C1917] whitespace-nowrap">
                  I acknowledge the cultural note & credit
                </span>
              </label>
            </div>
          )}
        </div>
      </section>

      {/* Step 2: Variation Controls */}
      <section
        className={`bg-white border border-[#E5DEC9] rounded-lg p-6 space-y-6 transition-opacity ${
          isBlocked || !acknowledgedCulturalNote ? 'opacity-55 pointer-events-none select-none' : ''
        }`}
        aria-disabled={isBlocked || !acknowledgedCulturalNote}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F2EDE2]">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#78716C] font-medium">
              Step 2 · Variation Parameters
            </p>
            <h2 className="font-serif text-2xl font-medium text-[#1C1917]">
              Configure Cultural Remix
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setShowTemplate((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#44403C] bg-[#FBF9F5] border border-[#D6CEBE] hover:border-[#9A3412] rounded-md cursor-pointer self-start sm:self-auto"
          >
            {showTemplate ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showTemplate ? 'Hide Prompt Template' : 'Inspect Prompt Template'}
          </button>
        </div>

        <div className="space-y-2.5">
          <span className="block text-xs font-medium text-[#44403C]">
            Choose Variation Type
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {VARIATION_OPTIONS.map((option) => {
              const selected = variationType === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setVariationType(option.id)}
                  className={`p-3.5 text-left rounded-md border transition-colors cursor-pointer flex flex-col justify-between gap-1.5 ${
                    selected
                      ? 'bg-[#FBF9F5] border-[#9A3412]'
                      : 'bg-white border-[#E5DEC9] hover:border-[#C7BDA9]'
                  }`}
                >
                  <div className="text-sm font-semibold text-[#1C1917]">{option.label}</div>
                  <div className="text-xs text-[#57534E] leading-snug">{option.shortDesc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {variationType === 'mix_second_motif' && (
          <div className="p-4 bg-[#FBF9F5] border border-[#E5DEC9] rounded-md space-y-2">
            <label
              htmlFor="secondary-motif-select"
              className="block text-xs font-medium text-[#1C1917]"
            >
              Select Second Folk Motif to Blend (Protected motifs are excluded)
            </label>
            {remixableSecondaryMotifs.length === 0 ? (
              <p className="text-xs text-[#78350F]">
                Upload at least one more remixable motif to blend two traditions.
              </p>
            ) : (
              <select
                id="secondary-motif-select"
                value={secondaryMotif?.id ?? ''}
                onChange={(e) => setSecondaryMotifId(e.target.value)}
                className="w-full sm:w-auto min-w-[280px] px-3 py-2 text-sm bg-white border border-[#D6CEBE] rounded-md text-[#1C1917] focus:outline-none focus:border-[#9A3412]"
              >
                {remixableSecondaryMotifs.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title} — {m.artistName} ({m.artStyle})
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-6 space-y-2">
            <label
              htmlFor="custom-direction"
              className="block text-xs font-medium text-[#44403C]"
            >
              Creative Direction (Optional)
            </label>
            <textarea
              id="custom-direction"
              rows={3}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g., Adapt for handloom indigo cotton border with warm saffron highlights..."
              className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md text-[#1C1917] focus:outline-none focus:border-[#9A3412]"
            />

            {livingArtistCheck.flagged && (
              <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-md text-xs text-[#92400E] flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{livingArtistCheck.reason}</span>
              </div>
            )}
          </div>

          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="remixer-name"
                className="block text-xs font-medium text-[#44403C] mb-1.5"
              >
                Your Name / Studio
              </label>
              <input
                id="remixer-name"
                type="text"
                value={remixerName}
                onChange={(e) => setRemixerName(e.target.value)}
                placeholder="Designer name"
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md text-[#1C1917] focus:outline-none focus:border-[#9A3412]"
              />
            </div>

            <div>
              <span className="block text-xs font-medium text-[#44403C] mb-1.5">
                Image Resolution
              </span>
              <div className="flex items-center gap-1 p-1 bg-[#F2EDE2] border border-[#E5DEC9] rounded-md">
                {(['1K', '2K', '4K'] as const).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setResolution(size)}
                    className={`flex-1 py-1.5 text-xs font-mono font-medium rounded transition-colors cursor-pointer ${
                      resolution === size
                        ? 'bg-white text-[#1C1917] shadow-xs'
                        : 'text-[#57534E] hover:text-[#1C1917]'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="block text-xs font-medium text-[#44403C] mb-1.5">
                Variations Count
              </span>
              <div className="flex items-center gap-1 p-1 bg-[#F2EDE2] border border-[#E5DEC9] rounded-md">
                {([3, 4] as const).map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setVariationCount(cnt)}
                    className={`flex-1 py-1.5 text-xs font-mono font-medium rounded transition-colors cursor-pointer ${
                      variationCount === cnt
                        ? 'bg-white text-[#1C1917] shadow-xs'
                        : 'text-[#57534E] hover:text-[#1C1917]'
                    }`}
                  >
                    {cnt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {showTemplate && (
          <div className="p-4 bg-[#1C1917] text-[#FBF9F5] rounded-md space-y-2">
            <div className="text-xs uppercase tracking-widest text-[#D6CEBE]">
              Assembled Cultural Preservation Prompt (Variant 1 Preview)
            </div>
            <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed text-[#E7E5E4]">
              {previewPrompt}
            </pre>
          </div>
        )}

        <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-[#57534E]">
            Attached credit on all outputs:{' '}
            <span className="font-medium text-[#1C1917]">“{creditPreview}”</span>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={
              isGenerating ||
              isBlocked ||
              !acknowledgedCulturalNote ||
              (variationType === 'mix_second_motif' && !secondaryMotif)
            }
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-[#FBF9F5] bg-[#9A3412] hover:bg-[#7C2D12] disabled:opacity-50 rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            {isGenerating && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
            {isGenerating
              ? `Generating ${variationCount} Variations...`
              : `Generate ${variationCount} Variations (${resolution})`}
          </button>
        </div>
      </section>

      {/* Loading, Error & Generated Variations Output */}
      {generateError && (
        <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm text-[#991B1B]">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <div className="font-semibold">Image Generation Error</div>
              <p className="text-xs mt-0.5 text-[#7F1D1D]">{generateError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-4 py-1.5 text-xs font-medium bg-white border border-[#FCA5A5] hover:bg-[#FEE2E2] rounded-md cursor-pointer self-start sm:self-auto shrink-0"
          >
            Retry Generation
          </button>
        </div>
      )}

      {generateWarning && (
        <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-md text-xs text-[#92400E]">
          {generateWarning}
        </div>
      )}

      {saveError && (
        <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-md text-xs text-[#991B1B]">
          {saveError}
        </div>
      )}

      {(isGenerating || generatedVariations.length > 0) && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl font-medium text-[#1C1917]">
              Generated Variations
            </h2>
            <span className="text-xs text-[#78716C]">
              Select any variation to save it with a provenance link
            </span>
          </div>

          {isGenerating ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: variationCount }).map((_, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-[#E5DEC9] rounded-lg overflow-hidden animate-pulse"
                >
                  <div className="aspect-square bg-[#EBE6DF] flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-[#9A3412] animate-spin" />
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-[#EBE6DF] rounded w-2/3" />
                    <div className="h-3 bg-[#F2EDE2] rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {generatedVariations.map((variation, idx) => {
                const certCode = savedVariationIds[variation.id];
                return (
                  <article
                    key={variation.id}
                    className="bg-white border border-[#E5DEC9] rounded-lg overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      <div className="aspect-square bg-[#EBE6DF] border-b border-[#E5DEC9] overflow-hidden">
                        <img
                          src={variation.imageDataUrl}
                          alt={`Variation ${idx + 1} of ${activeMotif.title}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-4 space-y-2">
                        <div className="text-xs uppercase tracking-widest text-[#78716C] font-medium">
                          Variation {idx + 1} · {resolution}
                        </div>
                        <p className="text-xs text-[#44403C] leading-relaxed">
                          {variation.angleLabel}
                        </p>
                        <p className="text-xs font-medium text-[#1C1917] pt-1 border-t border-[#F2EDE2]">
                          {creditPreview}
                        </p>
                      </div>
                    </div>

                    <div className="px-4 pb-4">
                      {certCode ? (
                        <div className="w-full py-2 px-3 bg-[#ECFDF5] border border-[#A7F3D0] rounded-md text-xs font-medium text-[#065F46] flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                          <span>Saved · {certCode}</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSaveVariation(variation)}
                          className="w-full py-2 px-3 text-xs font-semibold text-[#FBF9F5] bg-[#1C1917] hover:bg-[#9A3412] rounded-md transition-colors cursor-pointer"
                        >
                          Save as Remix
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Saved Remixes Lineage for this Motif */}
      <section className="pt-6 border-t border-[#E5DEC9] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-2xl font-medium text-[#1C1917]">
              Saved Remixes Linked to “{activeMotif.title}”
            </h2>
            <p className="text-xs text-[#78716C]">
              Every saved remix retains its parent motif ID and permanent attribution record.
            </p>
          </div>
          <span className="font-mono text-xs text-[#57534E] tabular-nums">
            {motifSavedRemixes.length} saved
          </span>
        </div>

        {motifSavedRemixes.length === 0 ? (
          <div className="p-6 bg-white border border-[#E5DEC9] rounded-lg text-sm text-[#57534E]">
            No remixes saved for this motif yet. Acknowledge the cultural note above and generate
            variations to record the first derivative.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {motifSavedRemixes.map((remix) => (
              <article
                key={remix.id}
                className="bg-white border border-[#E5DEC9] rounded-lg overflow-hidden"
              >
                <div className="aspect-square bg-[#EBE6DF] border-b border-[#E5DEC9]">
                  <img
                    src={remix.imageDataUrl}
                    alt={`${remix.creditLine} remix`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#78716C]">
                    <span className="capitalize">{remix.variationType.replace(/_/g, ' ')}</span>
                    <span className="font-mono font-semibold text-[#9A3412]">
                      {remix.shortCode}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-[#1C1917]">
                    Remixed by {remix.remixerName}
                  </p>
                  <p className="text-xs text-[#9A3412] font-medium">{remix.creditLine}</p>
                  <p className="text-[11px] font-mono text-[#78716C]">
                    Parent: {remix.sourceMotifId} · {remix.resolution}
                  </p>
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => onOpenMockup(remix.id)}
                      className="flex-1 py-2 px-2.5 text-xs font-semibold text-[#FBF9F5] bg-[#1C1917] hover:bg-[#9A3412] rounded-md transition-colors cursor-pointer"
                    >
                      Mockup
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenProvenanceByRemix(remix.id)}
                      className="flex-1 py-2 px-2.5 text-xs font-medium text-[#1C1917] bg-[#F2EDE2] hover:bg-[#E5DEC9] rounded-md transition-colors cursor-pointer"
                    >
                      Provenance
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
