import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  Loader2,
  Lock,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import type { Mockup, Motif, ProductType, Remix } from '../types';
import {
  PRODUCT_OPTIONS,
  PRODUCT_TONES,
  type ProductTone,
  formatMockupCredit,
  renderProductMockupToCanvas,
} from '../utils/mockupCanvas';
import {
  compressDataUrl,
  saveMockupWithProvenance,
  saveRemixWithProvenance,
} from '../utils/storage';

interface MockupStudioPageProps {
  motifs: Motif[];
  remixes: Remix[];
  mockups: Mockup[];
  selectedRemixId: string | null;
  onSelectRemix: (remixId: string) => void;
  onRemixCreated: (remix: Remix) => void;
  onMockupSaved: (mockup: Mockup) => void;
  onGoToRemixStudio: (motifId?: string) => void;
  onOpenProvenanceByRemix: (remixId: string) => void;
  onSupportArtist: (motif: Motif) => void;
}

export const MockupStudioPage: React.FC<MockupStudioPageProps> = ({
  motifs,
  remixes,
  mockups,
  selectedRemixId,
  onSelectRemix,
  onRemixCreated,
  onMockupSaved,
  onGoToRemixStudio,
  onOpenProvenanceByRemix,
  onSupportArtist,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const activeRemix = useMemo(
    () => remixes.find((r) => r.id === selectedRemixId) ?? remixes[0] ?? null,
    [remixes, selectedRemixId],
  );

  const activeMotif = useMemo(() => {
    if (!activeRemix) return null;
    return motifs.find((m) => m.id === activeRemix.sourceMotifId) ?? null;
  }, [motifs, activeRemix]);

  const remixableMotifs = useMemo(
    () => motifs.filter((m) => m.license !== 'not_allowed'),
    [motifs],
  );

  const [productType, setProductType] = useState<ProductType>('tote_bag');
  const [tone, setTone] = useState<ProductTone>('ivory');
  const [creatorName, setCreatorName] = useState('Studio Kolkata');
  const [captionText, setCaptionText] = useState('');
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [captionError, setCaptionError] = useState<string | null>(null);

  const [renderedDataUrl, setRenderedDataUrl] = useState<string>('');
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [directStudyMotifId, setDirectStudyMotifId] = useState<string>(
    () => remixableMotifs[0]?.id ?? '',
  );

  const creditLine = useMemo(() => {
    if (!activeRemix || !activeMotif) return '';
    return formatMockupCredit({
      artistName: activeMotif.artistName,
      artStyle: activeMotif.artStyle,
      remixId: activeRemix.shortCode || activeRemix.id,
    });
  }, [activeRemix, activeMotif]);

  useEffect(() => {
    if (!activeRemix || !activeMotif || !canvasRef.current) return;
    let cancelled = false;
    setIsRendering(true);
    setRenderError(null);
    setSavedNotice(null);

    renderProductMockupToCanvas(canvasRef.current, {
      artworkSrc: activeRemix.imageDataUrl,
      productType,
      tone,
      artistName: activeMotif.artistName,
      artStyle: activeMotif.artStyle,
      remixId: activeRemix.shortCode || activeRemix.id,
      motifTitle: activeMotif.title,
    })
      .then((dataUrl) => {
        if (!cancelled) {
          setRenderedDataUrl(dataUrl);
          setIsRendering(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setRenderError(
            err instanceof Error ? err.message : 'Failed to composite product mockup.',
          );
          setIsRendering(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeRemix, activeMotif, productType, tone]);

  const handleRegisterDirectStudy = () => {
    const targetMotif =
      remixableMotifs.find((m) => m.id === directStudyMotifId) ?? remixableMotifs[0];
    if (!targetMotif) return;

    const { remix } = saveRemixWithProvenance({
      primaryMotif: targetMotif,
      remixerName: creatorName.trim() || 'Studio Kolkata',
      variationType: 'color_palette',
      customPrompt: 'Direct licensed archival print study (unmodified original)',
      fullPromptUsed: 'Direct licensed archival print study without AI alteration.',
      resolution: '1K',
      imageDataUrl: targetMotif.imageDataUrl,
      livingArtistWarningTriggered: false,
    });
    onRemixCreated(remix);
    onSelectRemix(remix.id);
  };

  const handleGenerateCaption = async () => {
    if (!activeMotif || !activeRemix) return;
    setIsGeneratingCaption(true);
    setCaptionError(null);
    try {
      const response = await fetch('/api/gemini/product-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistName: activeMotif.artistName,
          artStyle: activeMotif.artStyle,
          region: activeMotif.region,
          motifTitle: activeMotif.title,
          productType,
          creditLine,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Could not generate caption.');
      }
      setCaptionText(data.caption || '');
    } catch (err) {
      setCaptionError(err instanceof Error ? err.message : 'Caption request failed.');
    } finally {
      setIsGeneratingCaption(false);
    }
  };

  const handleDownloadPng = () => {
    if (!renderedDataUrl || !activeRemix) return;
    const link = document.createElement('a');
    link.href = renderedDataUrl;
    link.download = `folk-art-mockup-${productType}-${activeRemix.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveMockup = async () => {
    if (!renderedDataUrl || !activeRemix || !activeMotif) return;
    const compressed = await compressDataUrl(renderedDataUrl, 960);
    const { mockup } = saveMockupWithProvenance({
      remix: activeRemix,
      motif: activeMotif,
      creatorName: creatorName.trim() || activeRemix.remixerName,
      productType,
      imageDataUrl: compressed,
      captionText,
    });
    onMockupSaved(mockup);
    setSavedNotice(`Saved ${mockup.id} to Provenance Archive.`);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
      <div className="pb-6 border-b border-[#E5DEC9] flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => onGoToRemixStudio(activeMotif?.id)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#57534E] hover:text-[#1C1917] cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            Back to Remix Studio
          </button>
          <h1 className="font-serif text-3xl lg:text-4xl font-medium text-[#1C1917]">
            Product Mockup Generator
          </h1>
          <p className="text-sm text-[#44403C] max-w-2xl">
            Place a saved remix onto six tactile craft products using deterministic high-DPI canvas
            compositing with an unremovable attribution bar baked directly into every exported PNG.
          </p>
        </div>

        {remixes.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label
              htmlFor="remix-selector"
              className="text-xs font-medium text-[#57534E] whitespace-nowrap"
            >
              Active Remix:
            </label>
            <select
              id="remix-selector"
              value={activeRemix?.id ?? ''}
              onChange={(e) => onSelectRemix(e.target.value)}
              className="px-3 py-2 text-sm bg-white border border-[#D6CEBE] rounded-md text-[#1C1917] focus:outline-none focus:border-[#9A3412] cursor-pointer max-w-sm"
            >
              {remixes.map((r) => {
                const parent = motifs.find((m) => m.id === r.sourceMotifId);
                return (
                  <option key={r.id} value={r.id}>
                    {parent?.title ?? 'Motif'} · {r.variationType.replace(/_/g, ' ')} ({r.id})
                  </option>
                );
              })}
            </select>
          </div>
        )}
      </div>

      {!activeRemix || !activeMotif ? (
        <section className="bg-white border border-[#E5DEC9] rounded-lg p-8 space-y-6 max-w-3xl">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-widest text-[#9A3412] font-medium">
              No Saved Remixes Yet
            </p>
            <h2 className="font-serif text-2xl font-medium text-[#1C1917]">
              Select a Remix or Register a Licensed Print Study
            </h2>
            <p className="text-sm text-[#44403C] leading-relaxed">
              Generate and save an AI variation in the Remix Studio first, or register a direct
              licensed print study from any remix-eligible motif below to test all six product
              mockups immediately.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onGoToRemixStudio(remixableMotifs[0]?.id)}
              className="px-5 py-2.5 text-sm font-semibold text-[#FBF9F5] bg-[#9A3412] hover:bg-[#7C2D12] rounded-md transition-colors cursor-pointer whitespace-nowrap"
            >
              Open Remix Studio
            </button>

            {remixableMotifs.length > 0 && (
              <div className="flex flex-1 items-center gap-2">
                <select
                  value={directStudyMotifId}
                  onChange={(e) => setDirectStudyMotifId(e.target.value)}
                  aria-label="Select a licensed motif for direct print study"
                  className="flex-1 min-w-0 px-3 py-2.5 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md text-[#1C1917]"
                >
                  {remixableMotifs.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title} — {m.artistName} ({m.artStyle})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleRegisterDirectStudy}
                  className="px-4 py-2.5 text-xs font-semibold text-[#1C1917] bg-[#F2EDE2] hover:bg-[#E5DEC9] border border-[#D6CEBE] rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  Use Direct Print Study
                </button>
              </div>
            )}
          </div>
        </section>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Controls */}
          <div className="lg:col-span-5 space-y-6">
            <section className="bg-white border border-[#E5DEC9] rounded-lg p-5 space-y-4">
              <span className="block text-xs uppercase tracking-widest text-[#78716C] font-medium">
                1. Choose Product Template
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                {PRODUCT_OPTIONS.map((product) => {
                  const selected = productType === product.id;
                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => setProductType(product.id)}
                      className={`p-3 text-left rounded-md border transition-colors cursor-pointer ${
                        selected
                          ? 'bg-[#FBF9F5] border-[#9A3412]'
                          : 'bg-white border-[#E5DEC9] hover:border-[#C7BDA9]'
                      }`}
                    >
                      <div className="text-sm font-semibold text-[#1C1917]">{product.label}</div>
                      <div className="text-xs text-[#57534E] mt-0.5 leading-snug">
                        {product.subtitle}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="bg-white border border-[#E5DEC9] rounded-lg p-5 space-y-4">
              <span className="block text-xs uppercase tracking-widest text-[#78716C] font-medium">
                2. Surface Tone & Attribution Details
              </span>

              <div className="space-y-2">
                <span className="block text-xs font-medium text-[#44403C]">
                  Material Base Tone
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {PRODUCT_TONES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTone(t.id)}
                      className={`p-2 rounded-md border text-center transition-colors cursor-pointer ${
                        tone === t.id
                          ? 'border-[#9A3412] bg-[#FBF9F5]'
                          : 'border-[#E5DEC9] hover:border-[#C7BDA9]'
                      }`}
                    >
                      <span
                        className="block w-5 h-5 rounded-full mx-auto mb-1 border border-black/15"
                        style={{ backgroundColor: t.fill }}
                      />
                      <span className="block text-[11px] font-medium text-[#1C1917] truncate">
                        {t.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="mockup-creator"
                  className="block text-xs font-medium text-[#44403C] mb-1"
                >
                  Mockup Creator / Buyer Name
                </label>
                <input
                  id="mockup-creator"
                  type="text"
                  value={creatorName}
                  onChange={(e) => setCreatorName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md text-[#1C1917] focus:outline-none focus:border-[#9A3412]"
                />
              </div>

              <div className="p-3.5 bg-[#1C1917] text-[#FBF9F5] rounded-md space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-[#D6CEBE]">
                  <Lock className="w-3.5 h-3.5 text-[#EA580C]" aria-hidden="true" />
                  <span>Locked Attribution (Cannot Be Removed)</span>
                </div>
                <p className="font-serif text-sm font-medium text-white break-words">
                  {creditLine}
                </p>
                <p className="text-[11px] text-[#A8A29E]">
                  This credit strip is baked directly into the exported PNG pixels.
                </p>
              </div>
            </section>

            <section className="bg-white border border-[#E5DEC9] rounded-lg p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs uppercase tracking-widest text-[#78716C] font-medium">
                  3. Ethical Product Caption (Optional)
                </span>
                <button
                  type="button"
                  onClick={handleGenerateCaption}
                  disabled={isGeneratingCaption}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#9A3412] hover:underline disabled:opacity-50 cursor-pointer"
                >
                  {isGeneratingCaption ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  Draft with Gemini
                </button>
              </div>

              {captionError && (
                <p className="text-xs text-[#991B1B]">{captionError}</p>
              )}

              <textarea
                rows={3}
                value={captionText}
                onChange={(e) => setCaptionText(e.target.value)}
                placeholder="Write or generate a short buyer-facing story honoring the original artisan..."
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md text-[#1C1917] focus:outline-none focus:border-[#9A3412]"
              />
            </section>
          </div>

          {/* Right Column: Live Composited Mockup Preview & Export */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white border border-[#E5DEC9] rounded-lg p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs uppercase tracking-widest text-[#78716C] font-medium">
                    Composited Product Preview
                  </span>
                  <h2 className="font-serif text-xl font-medium text-[#1C1917]">
                    {PRODUCT_OPTIONS.find((p) => p.id === productType)?.label} — {activeMotif.title}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveMockup}
                    disabled={isRendering || !renderedDataUrl}
                    className="px-4 py-2 text-xs font-semibold text-[#1C1917] bg-[#F2EDE2] hover:bg-[#E5DEC9] disabled:opacity-50 border border-[#D6CEBE] rounded-md transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Save to Archive
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadPng}
                    disabled={isRendering || !renderedDataUrl}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#FBF9F5] bg-[#9A3412] hover:bg-[#7C2D12] disabled:opacity-50 rounded-md transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5" aria-hidden="true" />
                    Download PNG (Credit Baked In)
                  </button>
                </div>
              </div>

              {savedNotice && (
                <div className="p-3 bg-[#ECFDF5] border border-[#A7F3D0] rounded-md text-xs text-[#065F46] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{savedNotice}</span>
                </div>
              )}

              {renderError && (
                <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-md text-xs text-[#991B1B] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{renderError}</span>
                </div>
              )}

              <div className="relative bg-[#EBE6DF] border border-[#E5DEC9] rounded-md overflow-hidden">
                <canvas
                  ref={canvasRef}
                  className="w-full h-auto block"
                  aria-label={`Product mockup preview for ${creditLine}`}
                />
                {isRendering && (
                  <div className="absolute inset-0 bg-[#FBF9F5]/70 flex items-center justify-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#D6CEBE] rounded-md text-xs font-medium text-[#1C1917]">
                      <Loader2 className="w-4 h-4 animate-spin text-[#9A3412]" />
                      Rendering high-resolution mockup...
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#57534E]">
                <div className="flex items-center gap-3">
                  <span>
                    Remix ID:{' '}
                    <span className="font-mono font-semibold text-[#9A3412]">
                      {activeRemix.shortCode || activeRemix.id}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenProvenanceByRemix(activeRemix.id)}
                    className="text-[#9A3412] font-medium hover:underline cursor-pointer"
                  >
                    View Provenance & Certificate
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <span>
                    Original Artist:{' '}
                    <span className="font-medium text-[#1C1917]">{activeMotif.artistName}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => onSupportArtist(activeMotif)}
                    className="text-[#9A3412] font-semibold hover:underline cursor-pointer"
                  >
                    Thank / Support Artist
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Saved Product Mockups Archive */}
      <section className="pt-6 border-t border-[#E5DEC9] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-2xl font-medium text-[#1C1917]">
              Saved Product Mockups
            </h2>
            <p className="text-xs text-[#78716C]">
              Every exported mockup preserves its locked attribution line and provenance link.
            </p>
          </div>
          <span className="font-mono text-xs text-[#57534E] tabular-nums">
            {mockups.length} saved
          </span>
        </div>

        {mockups.length === 0 ? (
          <div className="p-6 bg-white border border-[#E5DEC9] rounded-lg text-sm text-[#57534E]">
            No product mockups saved yet. Choose a product template above and click Save to Archive.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockups.map((mockup) => (
              <article
                key={mockup.id}
                className="bg-white border border-[#E5DEC9] rounded-lg overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="bg-[#EBE6DF] border-b border-[#E5DEC9]">
                    <img
                      src={mockup.imageDataUrl}
                      alt={mockup.lockedCreditText}
                      className="w-full h-auto block"
                    />
                  </div>
                  <div className="p-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-[#78716C]">
                      <span className="capitalize">{mockup.productType.replace(/_/g, ' ')}</span>
                      <span className="font-mono">{mockup.id}</span>
                    </div>
                    <p className="text-xs font-medium text-[#9A3412]">{mockup.lockedCreditText}</p>
                    {mockup.captionText && (
                      <p className="text-xs text-[#44403C] leading-relaxed pt-1">
                        {mockup.captionText}
                      </p>
                    )}
                  </div>
                </div>
                <div className="px-4 pb-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenProvenanceByRemix(mockup.remixId)}
                    className="flex-1 py-2 px-3 text-xs font-medium text-[#1C1917] bg-white border border-[#D6CEBE] hover:border-[#9A3412] rounded-md transition-colors cursor-pointer"
                  >
                    Provenance
                  </button>
                  <a
                    href={mockup.imageDataUrl}
                    download={`folk-art-mockup-${mockup.productType}-${mockup.remixId}.png`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-[#1C1917] bg-[#F2EDE2] hover:bg-[#E5DEC9] rounded-md transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" aria-hidden="true" />
                    Download
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
