import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Lock,
  Search,
  ShieldCheck,
  X,
  RotateCcw,
  ArrowUpRight,
} from 'lucide-react';
import type { ArtStyle, LicenseType, Motif } from '../types';
import { ART_STYLES, LICENSE_META } from '../utils/storage';

interface MotifLibraryPageProps {
  motifs: Motif[];
  onGoToUpload: () => void;
  onOpenRemix: (motif: Motif) => void;
  onResetDemo: () => void;
  onAskGuideAboutMotif: (motif: Motif) => void;
  onSupportArtist: (motif: Motif) => void;
}

const LicenseIcon: React.FC<{ license: LicenseType }> = ({ license }) => {
  if (license === 'not_allowed') {
    return <Lock className="w-3.5 h-3.5 text-[#78350F] shrink-0" aria-hidden="true" />;
  }
  if (license === 'remix_with_credit') {
    return <ShieldCheck className="w-3.5 h-3.5 text-[#9A3412] shrink-0" aria-hidden="true" />;
  }
  return <CheckCircle2 className="w-3.5 h-3.5 text-[#14532D] shrink-0" aria-hidden="true" />;
};

const MotifImageFrame: React.FC<{
  src: string;
  alt: string;
  title: string;
  className?: string;
}> = ({ src, alt, title, className = '' }) => {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[#EBE6DF] text-[#57534E] p-6 text-center ${className}`}
      >
        <svg
          className="w-8 h-8 mb-2 text-[#9A3412]/70"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
        <span className="font-serif text-sm text-[#1C1917]">{title}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};

const AlponaCornerMotif: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 120 120"
    fill="none"
    aria-hidden="true"
    className={className}
  >
    <path
      d="M8 8H108M8 8V108"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeOpacity="0.45"
    />
    <path
      d="M16 16C34 16 44 26 44 44C26 44 16 34 16 16Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeOpacity="0.65"
    />
    <path
      d="M44 16C58 16 66 24 66 36C54 36 44 28 44 16Z"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeOpacity="0.45"
    />
    <path
      d="M16 44C16 58 24 66 36 66C36 54 28 44 16 44Z"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeOpacity="0.45"
    />
    <circle cx="28" cy="28" r="3" fill="currentColor" fillOpacity="0.7" />
    <circle cx="76" cy="20" r="2" fill="currentColor" fillOpacity="0.45" />
    <circle cx="20" cy="76" r="2" fill="currentColor" fillOpacity="0.45" />
  </svg>
);

export const MotifLibraryPage: React.FC<MotifLibraryPageProps> = ({
  motifs,
  onGoToUpload,
  onOpenRemix,
  onResetDemo,
  onAskGuideAboutMotif,
  onSupportArtist,
}) => {
  const [styleFilter, setStyleFilter] = useState<ArtStyle | 'all'>('all');
  const [licenseFilter, setLicenseFilter] = useState<LicenseType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMotif, setSelectedMotif] = useState<Motif | null>(null);

  const filteredMotifs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return motifs.filter((motif) => {
      if (styleFilter !== 'all' && motif.artStyle !== styleFilter) return false;
      if (licenseFilter !== 'all' && motif.license !== licenseFilter) return false;
      if (!q) return true;
      return (
        motif.title.toLowerCase().includes(q) ||
        motif.artistName.toLowerCase().includes(q) ||
        motif.region.toLowerCase().includes(q) ||
        motif.artStyle.toLowerCase().includes(q) ||
        motif.culturalNote.toLowerCase().includes(q)
      );
    });
  }, [motifs, styleFilter, licenseFilter, searchQuery]);

  const counts = useMemo(() => {
    const total = motifs.length;
    const remixable = motifs.filter((m) => m.license !== 'not_allowed').length;
    const protectedCount = motifs.filter((m) => m.license === 'not_allowed').length;
    return { total, remixable, protectedCount };
  }, [motifs]);

  const scrollToLibrary = () => {
    document.getElementById('motif-library-grid')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">
      {/* Bengali Alpona White-on-Terracotta Editorial Hero */}
      <section className="relative overflow-hidden rounded-xl bg-[#88291E] text-[#FBF9F5] border border-[#6E1F16] p-8 sm:p-10 lg:p-12">
        <AlponaCornerMotif className="w-24 h-24 text-[#FBF9F5] absolute top-3 left-3 pointer-events-none" />
        <AlponaCornerMotif className="w-24 h-24 text-[#FBF9F5] absolute top-3 right-3 rotate-90 pointer-events-none" />
        <AlponaCornerMotif className="w-24 h-24 text-[#FBF9F5] absolute bottom-3 left-3 -rotate-90 pointer-events-none" />
        <AlponaCornerMotif className="w-24 h-24 text-[#FBF9F5] absolute bottom-3 right-3 rotate-180 pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-5">
            <p className="text-xs uppercase tracking-[0.2em] text-[#FDE68A] font-medium">
              Kolkata · Patachitra · Alpona · Nakshi Kantha · Dokra
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-white leading-[1.12]">
              Folk Art Remix with Permanent Artist Credit
            </h1>
            <p className="text-sm sm:text-base text-[#F5EFE6] max-w-2xl leading-relaxed">
              Where Bengali folk artisans share living motifs on their own terms. Every AI
              adaptation enforces consent licenses, preserves cultural context, and bakes permanent
              attribution into every product mockup and provenance certificate.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={scrollToLibrary}
                className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#1C1917] bg-[#FBF9F5] hover:bg-[#FDE68A] rounded-md transition-colors cursor-pointer whitespace-nowrap"
              >
                Explore Motif Library
              </button>
              <button
                type="button"
                onClick={onGoToUpload}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#FBF9F5] bg-[#1E3A5F] hover:bg-[#162C49] border border-[#FBF9F5]/25 rounded-md transition-colors cursor-pointer whitespace-nowrap"
              >
                Upload Artisan Motif
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-4 bg-[#1E3A5F]/90 border border-[#FBF9F5]/20 rounded-lg p-5 space-y-4">
            <div className="text-xs uppercase tracking-widest text-[#FDE68A] font-semibold">
              Archive Pulse
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="py-2">
                <div className="font-serif text-2xl sm:text-3xl font-semibold text-white tabular-nums">
                  {counts.total}
                </div>
                <div className="text-[11px] text-[#E5DEC9] mt-0.5">Motifs</div>
              </div>
              <div className="py-2 border-x border-[#FBF9F5]/15">
                <div className="font-serif text-2xl sm:text-3xl font-semibold text-[#FDE68A] tabular-nums">
                  {counts.remixable}
                </div>
                <div className="text-[11px] text-[#E5DEC9] mt-0.5">Remixable</div>
              </div>
              <div className="py-2">
                <div className="font-serif text-2xl sm:text-3xl font-semibold text-white tabular-nums">
                  {counts.protectedCount}
                </div>
                <div className="text-[11px] text-[#E5DEC9] mt-0.5">Protected</div>
              </div>
            </div>
            <p className="text-xs text-[#E5DEC9] leading-relaxed border-t border-[#FBF9F5]/15 pt-3">
              Protected works remain viewable for heritage education while remix generation is
              strictly locked in code.
            </p>
          </div>
        </div>
      </section>

      {/* 3-Step How It Works Strip */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-8 border-b border-[#E5DEC9]">
        <div className="bg-white border border-[#E5DEC9] rounded-lg p-5 space-y-2">
          <div className="text-xs font-mono font-semibold text-[#9A3412]">01. Upload & Consent</div>
          <h2 className="font-serif text-lg font-medium text-[#1C1917]">
            Artisan Sets Story & License
          </h2>
          <p className="text-xs text-[#57534E] leading-relaxed">
            Artists upload folk motifs with region, cultural meaning, optional UPI handle, and
            choose Remix Allowed, Remix with Credit, or Not Allowed.
          </p>
        </div>

        <div className="bg-white border border-[#E5DEC9] rounded-lg p-5 space-y-2">
          <div className="text-xs font-mono font-semibold text-[#1E3A5F]">02. Cultural Remix</div>
          <h2 className="font-serif text-lg font-medium text-[#1C1917]">
            Ethical AI Adaptation
          </h2>
          <p className="text-xs text-[#57534E] leading-relaxed">
            Designers read the 2-line cultural note first, respect living-artist safeguards, and
            generate variations keeping traditional stroke rhythms intact.
          </p>
        </div>

        <div className="bg-white border border-[#E5DEC9] rounded-lg p-5 space-y-2">
          <div className="text-xs font-mono font-semibold text-[#78350F]">03. Credit & Certificate</div>
          <h2 className="font-serif text-lg font-medium text-[#1C1917]">
            Baked-In Mockup Attribution
          </h2>
          <p className="text-xs text-[#57534E] leading-relaxed">
            Product mockups bake the artist’s credit line directly into exported PNGs alongside a
            verifiable <span className="font-mono">RMX-XXXX</span> provenance tree.
          </p>
        </div>
      </section>

      {/* Motif Library Filter Bar */}
      <section id="motif-library-grid" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="font-serif text-2xl font-medium text-[#1C1917]">
              Archived Folk Motifs
            </h2>
            <p className="text-xs text-[#78716C]">
              Select any motif to inspect its cultural story, pigments, and licensing terms
            </p>
          </div>
          <span className="text-xs text-[#78716C] tabular-nums">
            Showing {filteredMotifs.length} of {motifs.length} motifs
          </span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div
            className="flex flex-wrap items-center gap-1 p-1 bg-[#F2EDE2] rounded-lg border border-[#E5DEC9]"
            role="group"
            aria-label="Filter by art style"
          >
            <button
              type="button"
              onClick={() => setStyleFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                styleFilter === 'all'
                  ? 'bg-white text-[#1C1917] shadow-xs'
                  : 'text-[#57534E] hover:text-[#1C1917]'
              }`}
            >
              All Styles
            </button>
            {ART_STYLES.map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => setStyleFilter(style)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  styleFilter === style
                    ? 'bg-white text-[#1C1917] shadow-xs'
                    : 'text-[#57534E] hover:text-[#1C1917]'
                }`}
              >
                {style}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1 sm:flex-initial">
              <Search
                className="w-4 h-4 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search motif, artist, region..."
                aria-label="Search motifs"
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#D6CEBE] rounded-md text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#9A3412]"
              />
            </div>

            <select
              value={licenseFilter}
              onChange={(e) => setLicenseFilter(e.target.value as LicenseType | 'all')}
              aria-label="Filter by license"
              className="px-3 py-2 text-sm bg-white border border-[#D6CEBE] rounded-md text-[#1C1917] focus:outline-none focus:border-[#9A3412] cursor-pointer"
            >
              <option value="all">All Licenses</option>
              <option value="remix_allowed">Remix Allowed</option>
              <option value="remix_with_credit">Remix with Credit</option>
              <option value="not_allowed">Not Allowed (Protected)</option>
            </select>
          </div>
        </div>

        {(styleFilter !== 'all' || licenseFilter !== 'all' || searchQuery) && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                setStyleFilter('all');
                setLicenseFilter('all');
                setSearchQuery('');
              }}
              className="text-xs text-[#9A3412] hover:underline font-medium cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>

      {filteredMotifs.length === 0 ? (
        <div className="py-16 px-6 text-center bg-white border border-[#E5DEC9] rounded-lg space-y-4">
          <p className="font-serif text-xl text-[#1C1917]">No motifs match your filters</p>
          <p className="text-sm text-[#57534E] max-w-md mx-auto">
            Try clearing the style or license filter, or upload a new folk motif to expand the
            collection.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setStyleFilter('all');
                setLicenseFilter('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 text-xs font-medium text-[#1C1917] bg-[#F2EDE2] hover:bg-[#E7E0D1] rounded-md cursor-pointer"
            >
              Clear Filters
            </button>
            <button
              type="button"
              onClick={onResetDemo}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-[#57534E] hover:text-[#1C1917] cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              Restore Starter Archive
            </button>
          </div>
        </div>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMotifs.map((motif) => {
            const licenseInfo = LICENSE_META[motif.license];
            return (
              <article
                key={motif.id}
                onClick={() => setSelectedMotif(motif)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedMotif(motif);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Inspect ${motif.title} by ${motif.artistName}`}
                className="group bg-white border border-[#E5DEC9] hover:border-[#9A3412]/70 rounded-lg overflow-hidden transition-colors flex flex-col cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9A3412]"
              >
                <div className="aspect-square bg-[#EBE6DF] overflow-hidden border-b border-[#E5DEC9]">
                  <MotifImageFrame
                    src={motif.imageDataUrl}
                    alt={`${motif.title} — ${motif.artStyle} motif by ${motif.artistName}`}
                    title={motif.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-[#78716C] truncate">
                      <span>{motif.artStyle}</span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">{motif.region}</span>
                    </div>

                    <h3 className="font-serif text-lg font-medium text-[#1C1917] leading-snug line-clamp-2">
                      {motif.title}
                    </h3>

                    <p className="text-sm text-[#44403C]">
                      By <span className="font-medium text-[#1C1917]">{motif.artistName}</span>
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#F2EDE2] flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                        motif.license === 'not_allowed'
                          ? 'text-[#78350F]'
                          : motif.license === 'remix_with_credit'
                            ? 'text-[#9A3412]'
                            : 'text-[#14532D]'
                      }`}
                    >
                      <LicenseIcon license={motif.license} />
                      <span>{licenseInfo.label}</span>
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenRemix(motif);
                      }}
                      className={`text-xs font-semibold px-2.5 py-1 rounded transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        motif.license === 'not_allowed'
                          ? 'text-[#78350F] bg-[#FEF3C7]/60 hover:bg-[#FEF3C7]'
                          : 'text-[#9A3412] hover:bg-[#9A3412] hover:text-white'
                      }`}
                    >
                      {motif.license === 'not_allowed' ? 'View Terms' : 'Remix'}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {selectedMotif && (
        <div
          className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[1px] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="motif-modal-title"
          onClick={() => setSelectedMotif(null)}
        >
          <div
            className="bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 bg-[#FBF9F5]/95 backdrop-blur-xs px-6 py-4 border-b border-[#E5DEC9] flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#78716C]">
                <span>Archival Record</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono">{selectedMotif.id}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMotif(null)}
                aria-label="Close archival record"
                className="p-1.5 text-[#57534E] hover:text-[#1C1917] rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              <div className="md:col-span-5 space-y-4">
                <div className="aspect-square bg-[#EBE6DF] border border-[#E5DEC9] rounded-md overflow-hidden">
                  <MotifImageFrame
                    src={selectedMotif.imageDataUrl}
                    alt={selectedMotif.title}
                    title={selectedMotif.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-widest text-[#78716C]">
                    Detected Pigments & Palette
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {selectedMotif.dominantColors.map((c, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-[#44403C]">
                        <span
                          className="w-4 h-4 rounded-sm border border-black/15 shrink-0"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span>{c.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="md:col-span-7 space-y-6">
                <div className="space-y-2">
                  <p className="text-xs text-[#78716C]">
                    {selectedMotif.detectedStyle || selectedMotif.artStyle} · {selectedMotif.region}
                  </p>
                  <h3
                    id="motif-modal-title"
                    className="font-serif text-3xl font-medium text-[#1C1917]"
                  >
                    {selectedMotif.title}
                  </h3>
                  <p className="text-sm text-[#44403C]">
                    Original Artist:{' '}
                    <span className="font-semibold text-[#1C1917]">{selectedMotif.artistName}</span>
                    {selectedMotif.contactOrHandle && (
                      <span className="text-[#78716C]"> · {selectedMotif.contactOrHandle}</span>
                    )}
                    {selectedMotif.upiId && (
                      <span className="text-[#78716C] font-mono text-xs">
                        {' '}
                        · UPI: {selectedMotif.upiId}
                      </span>
                    )}
                  </p>
                </div>

                <div className="p-4 bg-white border border-[#E5DEC9] rounded-md space-y-1.5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#1C1917]">
                    <LicenseIcon license={selectedMotif.license} />
                    <span>License: {LICENSE_META[selectedMotif.license].label}</span>
                  </div>
                  <p className="text-xs text-[#57534E] leading-relaxed">
                    {LICENSE_META[selectedMotif.license].description}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs uppercase tracking-widest text-[#78716C]">
                    Artisan Story & Meaning
                  </h4>
                  <p className="text-sm text-[#292524] leading-relaxed">{selectedMotif.story}</p>
                </div>

                {selectedMotif.motifDescription && (
                  <div className="space-y-2">
                    <h4 className="text-xs uppercase tracking-widest text-[#78716C]">
                      Visual Description
                    </h4>
                    <p className="text-sm text-[#44403C] leading-relaxed">
                      {selectedMotif.motifDescription}
                    </p>
                  </div>
                )}

                {selectedMotif.culturalNote && (
                  <div className="pt-4 border-t border-[#E5DEC9] space-y-1.5">
                    <h4 className="text-xs uppercase tracking-widest text-[#9A3412]">
                      Cultural Note
                    </h4>
                    <p className="text-sm font-serif italic text-[#292524] whitespace-pre-line leading-relaxed">
                      {selectedMotif.culturalNote}
                    </p>
                  </div>
                )}

                <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const target = selectedMotif;
                        setSelectedMotif(null);
                        onAskGuideAboutMotif(target);
                      }}
                      className="px-3.5 py-2 text-xs font-medium text-[#1C1917] bg-white border border-[#D6CEBE] hover:border-[#9A3412] rounded-md transition-colors cursor-pointer"
                    >
                      Ask Cultural Guide
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const target = selectedMotif;
                        setSelectedMotif(null);
                        onSupportArtist(target);
                      }}
                      className="px-3.5 py-2 text-xs font-medium text-[#9A3412] bg-white border border-[#D6CEBE] hover:border-[#9A3412] rounded-md transition-colors cursor-pointer"
                    >
                      Thank / Support Artist
                    </button>
                  </div>

                  {selectedMotif.license === 'not_allowed' ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#78350F]">
                      <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                      Remixing Disabled by Artist License
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const target = selectedMotif;
                        setSelectedMotif(null);
                        onOpenRemix(target);
                      }}
                      className="px-5 py-2 text-xs font-semibold text-[#FBF9F5] bg-[#9A3412] hover:bg-[#7C2D12] rounded-md transition-colors cursor-pointer"
                    >
                      Open in Remix Studio
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
