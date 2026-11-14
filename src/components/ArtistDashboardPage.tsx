import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Heart,
  Lock,
  ShieldCheck,
  ArrowUpRight,
} from 'lucide-react';
import type { Artist, LicenseType, Mockup, Motif, Remix } from '../types';
import { LICENSE_META } from '../utils/storage';

interface ArtistDashboardPageProps {
  artists: Artist[];
  motifs: Motif[];
  remixes: Remix[];
  mockups: Mockup[];
  onChangeMotifLicense: (motifId: string, newLicense: LicenseType) => void;
  onOpenSupportArtist: (
    artist: Pick<Artist, 'name' | 'region' | 'primaryStyle' | 'contactOrHandle' | 'upiId'>,
    motifTitle?: string,
  ) => void;
  onOpenProvenanceByRemix: (remixId: string) => void;
  onGoToUpload: () => void;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

export const ArtistDashboardPage: React.FC<ArtistDashboardPageProps> = ({
  artists,
  motifs,
  remixes,
  mockups,
  onChangeMotifLicense,
  onOpenSupportArtist,
  onOpenProvenanceByRemix,
  onGoToUpload,
}) => {
  const [selectedArtistId, setSelectedArtistId] = useState<string>('all');
  const [licenseUpdateNotice, setLicenseUpdateNotice] = useState<string | null>(null);

  const selectedArtist = useMemo(
    () =>
      selectedArtistId === 'all'
        ? null
        : artists.find((a) => a.id === selectedArtistId) ?? null,
    [artists, selectedArtistId],
  );

  const visibleMotifs = useMemo(() => {
    if (selectedArtistId === 'all') return motifs;
    return motifs.filter((m) => m.artistId === selectedArtistId);
  }, [motifs, selectedArtistId]);

  const motifStatsMap = useMemo(() => {
    const map = new Map<
      string,
      {
        remixes: Remix[];
        mockups: Mockup[];
        productsSummary: Array<{ productType: string; count: number }>;
      }
    >();

    for (const motif of motifs) {
      const linkedRemixes = remixes.filter(
        (r) => r.sourceMotifId === motif.id || r.secondaryMotifId === motif.id,
      );
      const remixIds = new Set(linkedRemixes.map((r) => r.id));
      const linkedMockups = mockups.filter(
        (mk) => mk.sourceMotifId === motif.id || remixIds.has(mk.remixId),
      );

      const productCounts = new Map<string, number>();
      for (const mk of linkedMockups) {
        productCounts.set(mk.productType, (productCounts.get(mk.productType) ?? 0) + 1);
      }
      const productsSummary = Array.from(productCounts.entries()).map(
        ([productType, count]) => ({ productType, count }),
      );

      map.set(motif.id, {
        remixes: linkedRemixes,
        mockups: linkedMockups,
        productsSummary,
      });
    }

    return map;
  }, [motifs, remixes, mockups]);

  const totals = useMemo(() => {
    let remixCount = 0;
    let mockupCount = 0;
    for (const m of visibleMotifs) {
      const entry = motifStatsMap.get(m.id);
      if (entry) {
        remixCount += entry.remixes.length;
        mockupCount += entry.mockups.length;
      }
    }
    const remixable = visibleMotifs.filter((m) => m.license !== 'not_allowed').length;
    return {
      motifs: visibleMotifs.length,
      remixCount,
      mockupCount,
      remixable,
    };
  }, [visibleMotifs, motifStatsMap]);

  const handleLicenseChange = (motif: Motif, nextLicense: LicenseType) => {
    if (motif.license === nextLicense) return;
    onChangeMotifLicense(motif.id, nextLicense);
    const existingCount = motifStatsMap.get(motif.id)?.remixes.length ?? 0;
    setLicenseUpdateNotice(
      `Updated "${motif.title}" to "${LICENSE_META[nextLicense].label}". Future remixes will enforce this rule; ${existingCount} existing remix record(s) keep their original historical license.`,
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
      {/* Header & Artist Switcher */}
      <section className="pb-8 border-b border-[#E5DEC9] flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-widest text-[#78716C] font-medium">
            Artisan Attribution & Control Center
          </p>
          <h1 className="font-serif text-3xl lg:text-4xl font-medium text-[#1C1917]">
            Artist Impact Dashboard
          </h1>
          <p className="text-sm text-[#44403C] max-w-2xl leading-relaxed">
            Track where your folk motifs are remixed, inspect which products feature your designs,
            and update licensing permissions at any time without altering past records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label
              htmlFor="artist-filter"
              className="text-xs font-medium text-[#57534E] whitespace-nowrap"
            >
              Artist View:
            </label>
            <select
              id="artist-filter"
              value={selectedArtistId}
              onChange={(e) => {
                setSelectedArtistId(e.target.value);
                setLicenseUpdateNotice(null);
              }}
              className="px-3 py-2 text-sm bg-white border border-[#D6CEBE] rounded-md text-[#1C1917] focus:outline-none focus:border-[#9A3412] cursor-pointer"
            >
              <option value="all">All Archived Artists ({artists.length})</option>
              {artists.map((artist) => (
                <option key={artist.id} value={artist.id}>
                  {artist.name} — {artist.primaryStyle}
                </option>
              ))}
            </select>
          </div>

          {selectedArtist && (
            <button
              type="button"
              onClick={() => onOpenSupportArtist(selectedArtist)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#FBF9F5] bg-[#9A3412] hover:bg-[#7C2D12] rounded-md transition-colors cursor-pointer whitespace-nowrap"
            >
              <Heart className="w-3.5 h-3.5" aria-hidden="true" />
              Thank You / Support {selectedArtist.name}
            </button>
          )}
        </div>
      </section>

      {/* KPI Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E5DEC9] rounded-lg p-5 space-y-1">
          <div className="text-xs uppercase tracking-widest text-[#78716C]">Motifs Listed</div>
          <div className="font-serif text-3xl font-semibold text-[#1C1917] tabular-nums">
            {totals.motifs}
          </div>
          <div className="text-xs text-[#57534E] tabular-nums">
            {totals.remixable} currently open to remix
          </div>
        </div>

        <div className="bg-white border border-[#E5DEC9] rounded-lg p-5 space-y-1">
          <div className="text-xs uppercase tracking-widest text-[#78716C]">Total Remixes</div>
          <div className="font-serif text-3xl font-semibold text-[#9A3412] tabular-nums">
            {totals.remixCount}
          </div>
          <div className="text-xs text-[#57534E]">Recorded derivatives with credit</div>
        </div>

        <div className="bg-white border border-[#E5DEC9] rounded-lg p-5 space-y-1">
          <div className="text-xs uppercase tracking-widest text-[#78716C]">Product Mockups</div>
          <div className="font-serif text-3xl font-semibold text-[#1C1917] tabular-nums">
            {totals.mockupCount}
          </div>
          <div className="text-xs text-[#57534E]">Craft items carrying attribution</div>
        </div>

        <div className="bg-white border border-[#E5DEC9] rounded-lg p-5 flex flex-col justify-between gap-2">
          <div className="text-xs uppercase tracking-widest text-[#78716C]">Archive Actions</div>
          <button
            type="button"
            onClick={onGoToUpload}
            className="inline-flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-[#1C1917] bg-[#F7F4EE] hover:bg-[#EBE6DF] border border-[#D6CEBE] rounded-md transition-colors cursor-pointer"
          >
            <span>Upload New Motif</span>
            <ArrowUpRight className="w-4 h-4 text-[#9A3412]" aria-hidden="true" />
          </button>
        </div>
      </section>

      {licenseUpdateNotice && (
        <div className="p-3.5 bg-[#ECFDF5] border border-[#A7F3D0] rounded-md text-xs text-[#065F46] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{licenseUpdateNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setLicenseUpdateNotice(null)}
            className="underline cursor-pointer shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Per-Motif Breakdown */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl font-medium text-[#1C1917]">
            Motif Lineage, Products & License Controls
          </h2>
          <span className="text-xs text-[#78716C] tabular-nums">
            {visibleMotifs.length} motif(s)
          </span>
        </div>

        {visibleMotifs.length === 0 ? (
          <div className="p-8 bg-white border border-[#E5DEC9] rounded-lg text-center space-y-3">
            <p className="font-serif text-xl text-[#1C1917]">No motifs found for this artist</p>
            <button
              type="button"
              onClick={onGoToUpload}
              className="px-4 py-2 text-xs font-semibold text-[#FBF9F5] bg-[#9A3412] rounded-md cursor-pointer"
            >
              Upload a Motif
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {visibleMotifs.map((motif) => {
              const stats = motifStatsMap.get(motif.id) ?? {
                remixes: [],
                mockups: [],
                productsSummary: [],
              };
              const artistRecord =
                artists.find((a) => a.id === motif.artistId) ?? {
                  name: motif.artistName,
                  region: motif.region,
                  primaryStyle: motif.artStyle,
                  contactOrHandle: motif.contactOrHandle,
                  upiId: motif.upiId,
                };

              return (
                <article
                  key={motif.id}
                  className="bg-white border border-[#E5DEC9] rounded-lg p-6 space-y-6"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    <div className="lg:col-span-2">
                      <div className="aspect-square bg-[#EBE6DF] border border-[#E5DEC9] rounded-md overflow-hidden">
                        <img
                          src={motif.imageDataUrl}
                          alt={motif.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>

                    <div className="lg:col-span-6 space-y-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#78716C]">
                        <span>{motif.artStyle}</span>
                        <span aria-hidden="true">·</span>
                        <span>{motif.region}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">{motif.id}</span>
                      </div>

                      <h3 className="font-serif text-2xl font-medium text-[#1C1917]">
                        {motif.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <span className="text-sm text-[#44403C]">
                          Artist:{' '}
                          <span className="font-semibold text-[#1C1917]">
                            {motif.artistName}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() => onOpenSupportArtist(artistRecord, motif.title)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-[#9A3412] bg-[#FBF9F5] border border-[#D6CEBE] hover:border-[#9A3412] rounded-md transition-colors cursor-pointer"
                        >
                          <Heart className="w-3.5 h-3.5" aria-hidden="true" />
                          Thank You / Support Artist
                        </button>
                      </div>

                      <div className="pt-2 flex flex-wrap items-center gap-6 text-xs text-[#44403C]">
                        <div>
                          <span className="text-[#78716C]">Remixes: </span>
                          <span className="font-mono font-semibold text-[#1C1917] tabular-nums">
                            {stats.remixes.length}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#78716C]">Products: </span>
                          {stats.productsSummary.length === 0 ? (
                            <span className="text-[#78716C]">None yet</span>
                          ) : (
                            <span className="font-medium text-[#1C1917]">
                              {stats.productsSummary
                                .map(
                                  (p) =>
                                    `${p.productType.replace(/_/g, ' ')} (${p.count})`,
                                )
                                .join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Live License Control */}
                    <div className="lg:col-span-4 p-4 bg-[#FBF9F5] border border-[#E5DEC9] rounded-md space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs uppercase tracking-widest text-[#78716C] font-semibold">
                          Active Motif License
                        </span>
                        {motif.license === 'not_allowed' ? (
                          <Lock className="w-3.5 h-3.5 text-[#78350F]" aria-hidden="true" />
                        ) : (
                          <ShieldCheck className="w-3.5 h-3.5 text-[#9A3412]" aria-hidden="true" />
                        )}
                      </div>

                      <select
                        value={motif.license}
                        onChange={(e) =>
                          handleLicenseChange(motif, e.target.value as LicenseType)
                        }
                        aria-label={`Change license for ${motif.title}`}
                        className="w-full px-3 py-2 text-xs font-medium bg-white border border-[#D6CEBE] rounded-md text-[#1C1917] focus:outline-none focus:border-[#9A3412] cursor-pointer"
                      >
                        <option value="remix_allowed">Remix Allowed</option>
                        <option value="remix_with_credit">Remix with Credit</option>
                        <option value="not_allowed">Not Allowed (Block Future Remixes)</option>
                      </select>

                      <p className="text-[11px] text-[#57534E] leading-relaxed">
                        {LICENSE_META[motif.license].description} Changing this applies to new
                        remixes immediately; existing records stay intact.
                      </p>
                    </div>
                  </div>

                  {/* Remixes & Products Table for this Motif */}
                  <div className="pt-4 border-t border-[#F2EDE2] space-y-3">
                    <div className="text-xs uppercase tracking-widest text-[#78716C] font-medium">
                      Remixes & Downstream Products ({stats.remixes.length})
                    </div>

                    {stats.remixes.length === 0 ? (
                      <p className="text-xs text-[#78716C]">
                        No remixes recorded for this motif yet.
                      </p>
                    ) : (
                      <div className="border border-[#E5DEC9] rounded-md overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#F7F4EE] border-b border-[#E5DEC9] text-[#57534E]">
                            <tr>
                              <th className="py-2.5 px-3 font-semibold">Remix ID</th>
                              <th className="py-2.5 px-3 font-semibold">Remixed By</th>
                              <th className="py-2.5 px-3 font-semibold">Variation</th>
                              <th className="py-2.5 px-3 font-semibold">Recorded License</th>
                              <th className="py-2.5 px-3 font-semibold">Products Appeared On</th>
                              <th className="py-2.5 px-3 font-semibold">Date</th>
                              <th className="py-2.5 px-3 font-semibold text-right">Provenance</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#F2EDE2]">
                            {stats.remixes.map((remix) => {
                              const remixMockups = stats.mockups.filter(
                                (mk) => mk.remixId === remix.id,
                              );
                              return (
                                <tr key={remix.id} className="hover:bg-[#FBF9F5]">
                                  <td className="py-2.5 px-3 font-mono font-semibold text-[#9A3412]">
                                    {remix.shortCode}
                                  </td>
                                  <td className="py-2.5 px-3 font-medium text-[#1C1917]">
                                    {remix.remixerName}
                                  </td>
                                  <td className="py-2.5 px-3 text-[#44403C] capitalize">
                                    {remix.variationType.replace(/_/g, ' ')}
                                  </td>
                                  <td className="py-2.5 px-3 text-[#57534E]">
                                    {LICENSE_META[remix.license].shortLabel}
                                  </td>
                                  <td className="py-2.5 px-3 text-[#1C1917] capitalize">
                                    {remixMockups.length === 0
                                      ? '—'
                                      : remixMockups
                                          .map((mk) => mk.productType.replace(/_/g, ' '))
                                          .join(', ')}
                                  </td>
                                  <td className="py-2.5 px-3 font-mono text-[#78716C] tabular-nums">
                                    {formatDate(remix.createdAt)}
                                  </td>
                                  <td className="py-2.5 px-3 text-right">
                                    <button
                                      type="button"
                                      onClick={() => onOpenProvenanceByRemix(remix.id)}
                                      className="font-semibold text-[#9A3412] hover:underline cursor-pointer"
                                    >
                                      View Tree
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
