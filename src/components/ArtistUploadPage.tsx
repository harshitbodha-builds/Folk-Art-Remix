import React, { useState } from 'react';
import {
  CheckCircle2,
  ImagePlus,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import type {
  ArtStyle,
  DominantColor,
  LicenseType,
  Motif,
  MotifAnalysisResult,
} from '../types';
import {
  ART_STYLES,
  LICENSE_META,
  fileToOptimizedDataUrl,
  saveArtistAndMotif,
} from '../utils/storage';

interface ArtistUploadPageProps {
  onMotifSaved: (saved: Motif) => void;
  onCancel: () => void;
}

export const ArtistUploadPage: React.FC<ArtistUploadPageProps> = ({
  onMotifSaved,
  onCancel,
}) => {
  const [imageDataUrl, setImageDataUrl] = useState<string>('');
  const [title, setTitle] = useState('');
  const [artStyle, setArtStyle] = useState<ArtStyle>('Patachitra');
  const [region, setRegion] = useState('');
  const [story, setStory] = useState('');
  const [artistName, setArtistName] = useState('');
  const [contactOrHandle, setContactOrHandle] = useState('');
  const [upiId, setUpiId] = useState('');
  const [license, setLicense] = useState<LicenseType>('remix_with_credit');
  const [consentConfirmed, setConsentConfirmed] = useState(false);

  const [motifDescription, setMotifDescription] = useState('');
  const [detectedStyle, setDetectedStyle] = useState('');
  const [dominantColors, setDominantColors] = useState<DominantColor[]>([]);
  const [culturalNote, setCulturalNote] = useState('');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisDone, setAnalysisDone] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const runGeminiAnalysis = async (
    targetImageDataUrl: string,
    overrides?: { title?: string; artStyle?: ArtStyle; region?: string; story?: string },
  ) => {
    if (!targetImageDataUrl) return;
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const response = await fetch('/api/gemini/analyze-motif', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: targetImageDataUrl,
          title: overrides?.title ?? title,
          artStyle: overrides?.artStyle ?? artStyle,
          region: overrides?.region ?? region,
          story: overrides?.story ?? story,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Gemini motif analysis failed.');
      }

      const data = payload as MotifAnalysisResult;
      setMotifDescription(data.motifDescription || '');
      setDetectedStyle(data.detectedStyle || '');
      setDominantColors(
        Array.isArray(data.dominantColors) && data.dominantColors.length > 0
          ? data.dominantColors
          : [],
      );
      setCulturalNote(data.culturalNote || '');
      setAnalysisDone(true);

      const matchedStyle = ART_STYLES.find(
        (s) => s.toLowerCase() === (data.detectedStyle || '').trim().toLowerCase(),
      );
      if (matchedStyle) {
        setArtStyle(matchedStyle);
      }
    } catch (err) {
      setAnalysisError(
        err instanceof Error
          ? err.message
          : 'Could not reach Gemini analysis service. You can still fill the fields manually.',
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFormError(null);
    try {
      const optimized = await fileToOptimizedDataUrl(file, 1024);
      setImageDataUrl(optimized);
      await runGeminiAnalysis(optimized);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to read image file.');
    }
  };

  const handleColorChange = (index: number, field: 'name' | 'hex', value: string) => {
    setDominantColors((prev) =>
      prev.map((c, idx) => (idx === index ? { ...c, [field]: value } : c)),
    );
  };

  const handleAddColor = () => {
    setDominantColors((prev) => [...prev, { name: 'Natural Ochre', hex: '#B45309' }]);
  };

  const handleRemoveColor = (index: number) => {
    setDominantColors((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (!imageDataUrl) {
      setFormError('Please upload a motif image before saving.');
      return;
    }
    if (!title.trim() || !region.trim() || !story.trim() || !artistName.trim()) {
      setFormError('Please fill in Title, Region, Cultural Story, and Artist Name.');
      return;
    }
    if (!consentConfirmed) {
      setFormError('You must confirm authorship and licensing consent to publish this motif.');
      return;
    }

    const { motif } = saveArtistAndMotif(
      {
        name: artistName.trim(),
        region: region.trim(),
        primaryStyle: artStyle,
        contactOrHandle: contactOrHandle.trim() || undefined,
        upiId: upiId.trim() || undefined,
      },
      {
        artistName: artistName.trim(),
        contactOrHandle: contactOrHandle.trim() || undefined,
        upiId: upiId.trim() || undefined,
        title: title.trim(),
        artStyle,
        region: region.trim(),
        imageDataUrl,
        story: story.trim(),
        motifDescription: motifDescription.trim(),
        detectedStyle: detectedStyle.trim() || artStyle,
        dominantColors,
        culturalNote: culturalNote.trim(),
        license,
        consentConfirmed,
      },
    );

    onMotifSaved(motif);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      <div className="pb-6 border-b border-[#E5DEC9] flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-[#78716C] font-medium">
            Artist Submission & Provenance Registration
          </p>
          <h1 className="font-serif text-3xl lg:text-4xl font-medium text-[#1C1917]">
            Archive a Folk Art Motif
          </h1>
          <p className="text-sm text-[#44403C] max-w-2xl">
            Upload your original artwork. Gemini inspects the visual craft to draft a description,
            style, pigment palette, and 2-line cultural note—all editable by you before publishing.
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-xs font-medium text-[#44403C] bg-white border border-[#D6CEBE] hover:border-[#1C1917] rounded-md transition-colors cursor-pointer self-start sm:self-auto whitespace-nowrap shrink-0"
        >
          Back to Library
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-[#E5DEC9] rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-[#78716C] font-medium">
                1. Motif Artwork Image
              </span>
              {imageDataUrl && (
                <button
                  type="button"
                  onClick={() => runGeminiAnalysis(imageDataUrl)}
                  disabled={isAnalyzing}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#9A3412] hover:underline disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`}
                    aria-hidden="true"
                  />
                  Re-analyze Image
                </button>
              )}
            </div>

            <label className="block cursor-pointer group">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
                className="sr-only"
              />
              {imageDataUrl ? (
                <div className="relative aspect-square bg-[#EBE6DF] rounded-md overflow-hidden border border-[#E5DEC9]">
                  <img
                    src={imageDataUrl}
                    alt="Uploaded folk art motif preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent p-3 flex items-center justify-between text-xs text-white">
                    <span>Click image to replace file</span>
                    <span className="underline">Choose another</span>
                  </div>
                </div>
              ) : (
                <div className="aspect-square bg-[#F7F4EE] border border-dashed border-[#C7BDA9] group-hover:border-[#9A3412] rounded-md flex flex-col items-center justify-center p-8 text-center transition-colors">
                  <ImagePlus className="w-9 h-9 text-[#9A3412]/80 mb-3" aria-hidden="true" />
                  <p className="font-serif text-lg text-[#1C1917] mb-1">
                    Upload Folk Motif Image
                  </p>
                  <p className="text-xs text-[#57534E] max-w-xs leading-relaxed">
                    PNG, JPG, or WebP. Gemini will automatically read pigments, brushwork, and
                    cultural context upon upload.
                  </p>
                </div>
              )}
            </label>
          </div>

          <div className="bg-white border border-[#E5DEC9] rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs uppercase tracking-widest text-[#78716C] font-medium">
                2. AI-Assisted Archival Notes (Editable)
              </span>
              {isAnalyzing && (
                <span className="inline-flex items-center gap-1.5 text-xs text-[#9A3412] font-medium">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                  Analyzing motif...
                </span>
              )}
              {!isAnalyzing && analysisDone && !analysisError && (
                <span className="inline-flex items-center gap-1 text-xs text-[#14532D] font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                  Ready to edit
                </span>
              )}
            </div>

            {analysisError && (
              <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-md text-xs text-[#991B1B] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{analysisError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="detected-style"
                  className="block text-xs font-medium text-[#44403C] mb-1"
                >
                  Detected Style
                </label>
                <input
                  id="detected-style"
                  type="text"
                  value={detectedStyle}
                  onChange={(e) => setDetectedStyle(e.target.value)}
                  placeholder="Auto-detected on upload (e.g. Medinipur Patachitra)"
                  className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md text-[#1C1917] focus:outline-none focus:border-[#9A3412]"
                />
              </div>

              <div>
                <label
                  htmlFor="motif-description"
                  className="block text-xs font-medium text-[#44403C] mb-1"
                >
                  Motif Description
                </label>
                <textarea
                  id="motif-description"
                  rows={3}
                  value={motifDescription}
                  onChange={(e) => setMotifDescription(e.target.value)}
                  placeholder="Visual composition and iconography auto-generated by Gemini..."
                  className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md text-[#1C1917] focus:outline-none focus:border-[#9A3412]"
                />
              </div>

              <div>
                <label
                  htmlFor="cultural-note"
                  className="block text-xs font-medium text-[#44403C] mb-1"
                >
                  2-Line Cultural Note
                </label>
                <textarea
                  id="cultural-note"
                  rows={2}
                  value={culturalNote}
                  onChange={(e) => setCulturalNote(e.target.value)}
                  placeholder="Concise 2-line heritage note shown to remixers before generating variations..."
                  className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md text-[#1C1917] focus:outline-none focus:border-[#9A3412]"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#44403C]">Dominant Colors</span>
                  <button
                    type="button"
                    onClick={handleAddColor}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#9A3412] hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    Add Color
                  </button>
                </div>

                {dominantColors.length === 0 ? (
                  <p className="text-xs text-[#78716C]">
                    Upload an image to auto-extract pigment colors, or click Add Color.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {dominantColors.map((color, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="color"
                          value={/^#[0-9A-Fa-f]{6}$/.test(color.hex) ? color.hex : '#9A3412'}
                          onChange={(e) => handleColorChange(index, 'hex', e.target.value)}
                          aria-label={`Color ${index + 1} swatch`}
                          className="w-8 h-8 rounded border border-[#D6CEBE] bg-white p-0.5 cursor-pointer shrink-0"
                        />
                        <input
                          type="text"
                          value={color.name}
                          onChange={(e) => handleColorChange(index, 'name', e.target.value)}
                          placeholder="Pigment name"
                          className="flex-1 min-w-0 px-2.5 py-1.5 text-xs bg-[#FBF9F5] border border-[#D6CEBE] rounded-md text-[#1C1917] focus:outline-none focus:border-[#9A3412]"
                        />
                        <input
                          type="text"
                          value={color.hex}
                          onChange={(e) => handleColorChange(index, 'hex', e.target.value)}
                          placeholder="#B93822"
                          className="w-20 px-2 py-1.5 text-xs font-mono bg-[#FBF9F5] border border-[#D6CEBE] rounded-md text-[#1C1917] focus:outline-none focus:border-[#9A3412]"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveColor(index)}
                          aria-label={`Remove color ${color.name}`}
                          className="p-1.5 text-[#78716C] hover:text-[#991B1B] cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white border border-[#E5DEC9] rounded-lg p-6 space-y-6">
          <span className="block text-xs uppercase tracking-widest text-[#78716C] font-medium">
            3. Motif Details, Attribution & License
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="motif-title" className="block text-xs font-medium text-[#44403C] mb-1">
                Motif Title <span className="text-[#9A3412]">*</span>
              </label>
              <input
                id="motif-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Bonbibi Forest Scroll"
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md text-[#1C1917] focus:outline-none focus:border-[#9A3412]"
              />
            </div>

            <div>
              <label htmlFor="art-style" className="block text-xs font-medium text-[#44403C] mb-1">
                Art Style <span className="text-[#9A3412]">*</span>
              </label>
              <select
                id="art-style"
                value={artStyle}
                onChange={(e) => setArtStyle(e.target.value as ArtStyle)}
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md text-[#1C1917] focus:outline-none focus:border-[#9A3412]"
              >
                {ART_STYLES.map((style) => (
                  <option key={style} value={style}>
                    {style}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="motif-region" className="block text-xs font-medium text-[#44403C] mb-1">
                Region / Origin <span className="text-[#9A3412]">*</span>
              </label>
              <input
                id="motif-region"
                type="text"
                required
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="e.g., Pingla, Paschim Medinipur"
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md text-[#1C1917] focus:outline-none focus:border-[#9A3412]"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="motif-story" className="block text-xs font-medium text-[#44403C] mb-1">
                Short Story or Cultural Meaning <span className="text-[#9A3412]">*</span>
              </label>
              <textarea
                id="motif-story"
                required
                rows={3}
                value={story}
                onChange={(e) => setStory(e.target.value)}
                placeholder="Share the folk narrative, ritual occasion, or community tradition behind this motif..."
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md text-[#1C1917] focus:outline-none focus:border-[#9A3412]"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#F2EDE2] grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="artist-name" className="block text-xs font-medium text-[#44403C] mb-1">
                Artist Name <span className="text-[#9A3412]">*</span>
              </label>
              <input
                id="artist-name"
                type="text"
                required
                value={artistName}
                onChange={(e) => setArtistName(e.target.value)}
                placeholder="e.g., Anwar Chitrakar"
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md text-[#1C1917] focus:outline-none focus:border-[#9A3412]"
              />
            </div>

            <div>
              <label htmlFor="artist-handle" className="block text-xs font-medium text-[#44403C] mb-1">
                Contact / Social Handle
              </label>
              <input
                id="artist-handle"
                type="text"
                value={contactOrHandle}
                onChange={(e) => setContactOrHandle(e.target.value)}
                placeholder="@handle or email"
                className="w-full px-3 py-2 text-sm bg-[#FBF9F5] border border-[#D6CEBE] rounded-md text-[#1C1917] focus:outline-none focus:border-[#9A3412]"
              />
            </div>

            <div>
              <label htmlFor="artist-upi" className="block text-xs font-medium text-[#44403C] mb-1">
                UPI ID (Optional Support)
              </label>
              <input
                id="artist-upi"
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="artist@upi"
                className="w-full px-3 py-2 text-sm font-mono bg-[#FBF9F5] border border-[#D6CEBE] rounded-md text-[#1C1917] focus:outline-none focus:border-[#9A3412]"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#F2EDE2] space-y-3">
            <span className="block text-xs font-medium text-[#44403C]">
              Licensing & Remix Permission <span className="text-[#9A3412]">*</span>
            </span>
            <div className="grid grid-cols-1 gap-2.5">
              {(['remix_with_credit', 'remix_allowed', 'not_allowed'] as LicenseType[]).map(
                (option) => {
                  const meta = LICENSE_META[option];
                  const checked = license === option;
                  return (
                    <label
                      key={option}
                      className={`flex items-start gap-3 p-3.5 rounded-md border transition-colors cursor-pointer ${
                        checked
                          ? 'bg-[#FBF9F5] border-[#9A3412]'
                          : 'bg-white border-[#E5DEC9] hover:border-[#C7BDA9]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="license"
                        value={option}
                        checked={checked}
                        onChange={() => setLicense(option)}
                        className="mt-0.5 accent-[#9A3412]"
                      />
                      <div className="space-y-0.5">
                        <div className="text-sm font-semibold text-[#1C1917]">{meta.label}</div>
                        <div className="text-xs text-[#57534E]">{meta.description}</div>
                      </div>
                    </label>
                  );
                },
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[#F2EDE2] space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consentConfirmed}
                onChange={(e) => setConsentConfirmed(e.target.checked)}
                className="mt-1 accent-[#9A3412] w-4 h-4 shrink-0"
              />
              <span className="text-xs text-[#44403C] leading-relaxed">
                I confirm that I am the original creator or authorized community representative for
                this motif, and I consent to storing it in the Folk Art Remix archive under the
                selected license with permanent attribution.
              </span>
            </label>

            {formError && (
              <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-md text-xs text-[#991B1B] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{formError}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-[#57534E] hover:text-[#1C1917] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isAnalyzing}
                className="px-6 py-2.5 text-sm font-semibold text-[#FBF9F5] bg-[#9A3412] hover:bg-[#7C2D12] disabled:opacity-50 rounded-md transition-colors cursor-pointer"
              >
                Save Motif to Archive
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
