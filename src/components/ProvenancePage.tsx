import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  CheckCircle2,
  Download,
  Printer,
  Search,
  ShieldCheck,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import type { Mockup, Motif, ProvenanceRecord, Remix } from '../types';
import { renderCreditCertificateDataUrl } from '../utils/certificateCanvas';
import { LICENSE_META, findProvenanceById } from '../utils/storage';

interface ProvenancePageProps {
  motifs: Motif[];
  remixes: Remix[];
  mockups: Mockup[];
  provenanceRecords: ProvenanceRecord[];
  selectedProvenanceId: string | null;
  onSelectProvenance: (id: string) => void;
  onGoToRemixStudio: () => void;
  onGoToMockupStudio: (remixId: string) => void;
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export const ProvenancePage: React.FC<ProvenancePageProps> = ({
  motifs,
  remixes,
  mockups,
  provenanceRecords,
  selectedProvenanceId,
  onSelectProvenance,
  onGoToRemixStudio,
  onGoToMockupStudio,
}) => {
  const [verifyQuery, setVerifyQuery] = useState('');
  const [verifyFeedback, setVerifyFeedback] = useState<{
    type: 'found' | 'not_found';
    message: string;
  } | null>(null);
  const [certificatePngUrl, setCertificatePngUrl] = useState<string>('');
  const [isBuildingCert, setIsBuildingCert] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeRecord = useMemo(
    () =>
      provenanceRecords.find((r) => r.id === selectedProvenanceId) ??
      provenanceRecords[0] ??
      null,
    [provenanceRecords, selectedProvenanceId],
  );

  const resolvedEntities = useMemo(() => {
    if (!activeRecord) return null;
    const motif = motifs.find((m) => m.id === activeRecord.rootMotifId) ?? null;
    const secondaryMotif = activeRecord.secondaryMotifId
      ? motifs.find((m) => m.id === activeRecord.secondaryMotifId) ?? null
      : null;
    const remix = remixes.find((r) => r.id === activeRecord.remixId) ?? null;
    const mockup = activeRecord.mockupId
      ? mockups.find((mk) => mk.id === activeRecord.mockupId) ?? null
      : null;
    return { motif, secondaryMotif, remix, mockup };
  }, [activeRecord, motifs, remixes, mockups]);

  useEffect(() => {
    if (!activeRecord || !resolvedEntities?.motif || !resolvedEntities?.remix) {
      setCertificatePngUrl('');
      return;
    }
    let cancelled = false;
    setIsBuildingCert(true);
    renderCreditCertificateDataUrl({
      provenance: activeRecord,
      motif: resolvedEntities.motif,
      secondaryMotif: resolvedEntities.secondaryMotif,
      remix: resolvedEntities.remix,
      mockup: resolvedEntities.mockup,
    })
      .then((url) => {
        if (!cancelled) {
          setCertificatePngUrl(url);
          setIsBuildingCert(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsBuildingCert(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeRecord, resolvedEntities]);

  const handleVerifySubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = verifyQuery.trim();
    if (!trimmed) return;

    const match = findProvenanceById(trimmed, provenanceRecords);
    if (match) {
      onSelectProvenance(match.id);
      setVerifyFeedback({
        type: 'found',
        message: `Verified attribution chain for ${match.remixShortCode} (${match.certificateCode}).`,
      });
    } else {
      setVerifyFeedback({
        type: 'not_found',
        message: `No provenance record matched "${trimmed}". Check the Remix Short ID (e.g. RMX-XXXX) or Certificate Code.`,
      });
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 1600);
  };

  const handleDownloadCertificatePng = () => {
    if (!certificatePngUrl || !activeRecord) return;
    const link = document.createElement('a');
    link.href = certificatePngUrl;
    link.download = `credit-certificate-${activeRecord.remixShortCode}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
      {/* Header & ID Verification Bar */}
      <section className="pb-8 border-b border-[#E5DEC9] grid grid-cols-1 lg:grid-cols-12 gap-8 items-end no-print">
        <div className="lg:col-span-6 space-y-3">
          <p className="text-xs uppercase tracking-widest text-[#78716C] font-medium">
            Attribution Ledger & Verification
          </p>
          <h1 className="font-serif text-3xl lg:text-4xl font-medium text-[#1C1917]">
            Provenance Tree & Credit Verification
          </h1>
          <p className="text-sm text-[#44403C] leading-relaxed">
            Every saved remix and product mockup receives a short unique ID and immutable
            provenance chain. Enter any Remix ID or Certificate Code to verify its artistic lineage.
          </p>
        </div>

        <div className="lg:col-span-6 space-y-3">
          <form onSubmit={handleVerifySubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search
                className="w-4 h-4 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="text"
                value={verifyQuery}
                onChange={(e) => setVerifyQuery(e.target.value)}
                placeholder="Enter Remix ID (e.g. RMX-7K4P) or Certificate Code..."
                aria-label="Verify Remix ID or Certificate Code"
                className="w-full pl-9 pr-3 py-2.5 text-sm font-mono bg-white border border-[#D6CEBE] rounded-md text-[#1C1917] placeholder:font-sans placeholder:text-[#A8A29E] focus:outline-none focus:border-[#9A3412]"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-semibold text-[#FBF9F5] bg-[#9A3412] hover:bg-[#7C2D12] rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              Verify ID
            </button>
          </form>

          {provenanceRecords.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#78716C]">
              <span>Recorded IDs:</span>
              {provenanceRecords.slice(0, 4).map((rec) => (
                <button
                  key={rec.id}
                  type="button"
                  onClick={() => {
                    setVerifyQuery(rec.remixShortCode);
                    onSelectProvenance(rec.id);
                    setVerifyFeedback({
                      type: 'found',
                      message: `Verified attribution chain for ${rec.remixShortCode} (${rec.certificateCode}).`,
                    });
                  }}
                  className="font-mono text-xs px-2 py-0.5 bg-white border border-[#D6CEBE] hover:border-[#9A3412] rounded text-[#1C1917] cursor-pointer"
                >
                  {rec.remixShortCode}
                </button>
              ))}
            </div>
          )}

          {verifyFeedback && (
            <div
              className={`p-3 rounded-md border text-xs flex items-center gap-2 ${
                verifyFeedback.type === 'found'
                  ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]'
                  : 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
              }`}
            >
              {verifyFeedback.type === 'found' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              )}
              <span>{verifyFeedback.message}</span>
            </div>
          )}
        </div>
      </section>

      {!activeRecord || !resolvedEntities?.motif || !resolvedEntities?.remix ? (
        <section className="bg-white border border-[#E5DEC9] rounded-lg p-10 text-center space-y-4">
          <p className="font-serif text-2xl text-[#1C1917]">No provenance chains recorded yet</p>
          <p className="text-sm text-[#57534E] max-w-lg mx-auto leading-relaxed">
            Save a remix in the Remix Studio or create a product mockup in Mockup Studio to
            automatically generate a verifiable provenance tree and downloadable Credit Certificate.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={onGoToRemixStudio}
              className="px-5 py-2.5 text-sm font-semibold text-[#FBF9F5] bg-[#9A3412] hover:bg-[#7C2D12] rounded-md transition-colors cursor-pointer"
            >
              Go to Remix Studio
            </button>
          </div>
        </section>
      ) : (
        <>
          {/* Visual Provenance Tree */}
          <section className="space-y-4 no-print">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="font-serif text-2xl font-medium text-[#1C1917]">
                  Visual Provenance Tree
                </h2>
                <p className="text-xs text-[#78716C]">
                  Lineage from original artisan motif to AI adaptation and finished product mockup
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-mono text-[#1C1917] bg-white border border-[#D6CEBE] px-2.5 py-1 rounded">
                  ID: {activeRecord.remixShortCode}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyCode(activeRecord.remixShortCode)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#F2EDE2] hover:bg-[#E5DEC9] rounded text-[#1C1917] cursor-pointer"
                >
                  {copiedId === activeRecord.remixShortCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#14532D]" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy ID
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-11 gap-4 items-stretch">
              {/* Node 1: Original Motif */}
              <article className="lg:col-span-3 bg-white border border-[#E5DEC9] rounded-lg overflow-hidden flex flex-col">
                <div className="px-4 py-2.5 bg-[#F7F4EE] border-b border-[#E5DEC9] flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#1C1917]">01. Original Motif</span>
                  <span className="font-mono text-[#78716C]">{resolvedEntities.motif.id}</span>
                </div>
                <div className="aspect-square bg-[#EBE6DF] border-b border-[#E5DEC9]">
                  <img
                    src={resolvedEntities.motif.imageDataUrl}
                    alt={resolvedEntities.motif.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4 space-y-1.5 flex-1">
                  <h3 className="font-serif text-base font-medium text-[#1C1917]">
                    {resolvedEntities.motif.title}
                  </h3>
                  <p className="text-xs text-[#44403C]">
                    Artist:{' '}
                    <span className="font-semibold text-[#1C1917]">
                      {resolvedEntities.motif.artistName}
                    </span>
                  </p>
                  <p className="text-xs text-[#78716C]">
                    {resolvedEntities.motif.artStyle} · {resolvedEntities.motif.region}
                  </p>
                  <p className="text-[11px] font-mono text-[#78716C] pt-1">
                    {formatDateTime(resolvedEntities.motif.createdAt)}
                  </p>
                  {resolvedEntities.secondaryMotif && (
                    <div className="mt-2 pt-2 border-t border-[#F2EDE2] text-xs text-[#57534E]">
                      Blended with: <strong className="text-[#1C1917]">{resolvedEntities.secondaryMotif.title}</strong> by{' '}
                      {resolvedEntities.secondaryMotif.artistName}
                    </div>
                  )}
                </div>
              </article>

              <div className="lg:col-span-1 flex items-center justify-center py-1">
                <ArrowRight className="w-5 h-5 text-[#9A3412] hidden lg:block" aria-hidden="true" />
                <ArrowDown className="w-5 h-5 text-[#9A3412] lg:hidden" aria-hidden="true" />
              </div>

              {/* Node 2: AI Remix */}
              <article className="lg:col-span-3 bg-white border border-[#E5DEC9] rounded-lg overflow-hidden flex flex-col">
                <div className="px-4 py-2.5 bg-[#F7F4EE] border-b border-[#E5DEC9] flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#1C1917]">02. AI Remix</span>
                  <span className="font-mono text-[#9A3412] font-semibold">
                    {resolvedEntities.remix.shortCode}
                  </span>
                </div>
                <div className="aspect-square bg-[#EBE6DF] border-b border-[#E5DEC9]">
                  <img
                    src={resolvedEntities.remix.imageDataUrl}
                    alt={resolvedEntities.remix.creditLine}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4 space-y-1.5 flex-1">
                  <h3 className="font-serif text-base font-medium text-[#1C1917] capitalize">
                    {resolvedEntities.remix.variationType.replace(/_/g, ' ')}
                  </h3>
                  <p className="text-xs text-[#44403C]">
                    Remixer:{' '}
                    <span className="font-semibold text-[#1C1917]">
                      {resolvedEntities.remix.remixerName}
                    </span>
                  </p>
                  <p className="text-xs text-[#78716C]">
                    Resolution: {resolvedEntities.remix.resolution} ·{' '}
                    {LICENSE_META[resolvedEntities.remix.license].shortLabel}
                  </p>
                  <p className="text-[11px] font-mono text-[#78716C] pt-1">
                    {formatDateTime(resolvedEntities.remix.createdAt)}
                  </p>
                  <details className="pt-2">
                    <summary className="text-xs text-[#9A3412] font-medium cursor-pointer">
                      View AI Prompt Recorded
                    </summary>
                    <p className="mt-1.5 text-[11px] font-mono text-[#57534E] bg-[#FBF9F5] p-2 rounded border border-[#E5DEC9] max-h-28 overflow-y-auto whitespace-pre-wrap">
                      {activeRecord.promptUsed}
                    </p>
                  </details>
                </div>
              </article>

              <div className="lg:col-span-1 flex items-center justify-center py-1">
                <ArrowRight className="w-5 h-5 text-[#9A3412] hidden lg:block" aria-hidden="true" />
                <ArrowDown className="w-5 h-5 text-[#9A3412] lg:hidden" aria-hidden="true" />
              </div>

              {/* Node 3: Product Mockup */}
              <article className="lg:col-span-3 bg-white border border-[#E5DEC9] rounded-lg overflow-hidden flex flex-col">
                <div className="px-4 py-2.5 bg-[#F7F4EE] border-b border-[#E5DEC9] flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#1C1917]">03. Product Mockup</span>
                  <span className="font-mono text-[#78716C]">
                    {resolvedEntities.mockup ? resolvedEntities.mockup.id : 'Pending'}
                  </span>
                </div>

                {resolvedEntities.mockup ? (
                  <>
                    <div className="aspect-square bg-[#EBE6DF] border-b border-[#E5DEC9]">
                      <img
                        src={resolvedEntities.mockup.imageDataUrl}
                        alt={resolvedEntities.mockup.lockedCreditText}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4 space-y-1.5 flex-1">
                      <h3 className="font-serif text-base font-medium text-[#1C1917] capitalize">
                        {resolvedEntities.mockup.productType.replace(/_/g, ' ')}
                      </h3>
                      <p className="text-xs text-[#44403C]">
                        Creator:{' '}
                        <span className="font-semibold text-[#1C1917]">
                          {resolvedEntities.mockup.creatorName}
                        </span>
                      </p>
                      <p className="text-xs text-[#9A3412] font-medium">
                        {resolvedEntities.mockup.lockedCreditText}
                      </p>
                      <p className="text-[11px] font-mono text-[#78716C] pt-1">
                        {formatDateTime(resolvedEntities.mockup.createdAt)}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="p-6 flex-1 flex flex-col items-center justify-center text-center space-y-3 bg-[#FBF9F5]">
                    <p className="font-serif text-base text-[#1C1917]">
                      No mockup attached to this branch yet
                    </p>
                    <p className="text-xs text-[#57534E]">
                      Place this remix on a t-shirt, tote bag, or saree border to complete the
                      3-stage chain.
                    </p>
                    <button
                      type="button"
                      onClick={() => onGoToMockupStudio(resolvedEntities.remix!.id)}
                      className="px-4 py-2 text-xs font-semibold text-[#FBF9F5] bg-[#1C1917] hover:bg-[#9A3412] rounded-md transition-colors cursor-pointer"
                    >
                      Create Product Mockup
                    </button>
                  </div>
                )}
              </article>
            </div>
          </section>

          {/* Credit Certificate Preview & Download */}
          <section className="space-y-4 printable-certificate">
            <div className="flex flex-wrap items-center justify-between gap-4 no-print">
              <div>
                <h2 className="font-serif text-2xl font-medium text-[#1C1917]">
                  Downloadable Credit Certificate
                </h2>
                <p className="text-xs text-[#78716C]">
                  Export as a high-resolution PNG certificate or save as PDF via Print.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintPdf}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#1C1917] bg-white border border-[#D6CEBE] hover:border-[#1C1917] rounded-md transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" aria-hidden="true" />
                  Print / Save PDF
                </button>
                <button
                  type="button"
                  onClick={handleDownloadCertificatePng}
                  disabled={isBuildingCert || !certificatePngUrl}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#FBF9F5] bg-[#9A3412] hover:bg-[#7C2D12] disabled:opacity-50 rounded-md transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  Download Certificate (PNG)
                </button>
              </div>
            </div>

            <div className="bg-[#FBF9F5] border-2 border-[#1C1917] p-2 rounded-sm">
              <div className="border border-[#9A3412] p-6 sm:p-8 space-y-6 bg-[#FBF9F5]">
                <div className="text-center space-y-1.5 pb-5 border-b border-[#E5DEC9]">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[#9A3412] font-semibold">
                    Folk Art Remix with Credit · Kolkata Cultural Archive
                  </p>
                  <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-[#1C1917]">
                    Certificate of Cultural Attribution
                  </h3>
                  <p className="text-xs text-[#57534E]">
                    Certificate Code:{' '}
                    <span className="font-mono font-semibold text-[#1C1917]">
                      {activeRecord.certificateCode}
                    </span>{' '}
                    · Remix ID:{' '}
                    <span className="font-mono font-semibold text-[#9A3412]">
                      {activeRecord.remixShortCode}
                    </span>
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                  <div className="md:col-span-5 grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="aspect-square bg-[#EBE6DF] border border-[#D6CEBE]">
                        <img
                          src={resolvedEntities.motif.imageDataUrl}
                          alt={resolvedEntities.motif.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-[11px] font-medium text-[#1C1917] truncate">
                        Original: {resolvedEntities.motif.artistName}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="aspect-square bg-[#EBE6DF] border border-[#D6CEBE]">
                        <img
                          src={
                            resolvedEntities.mockup?.imageDataUrl ||
                            resolvedEntities.remix.imageDataUrl
                          }
                          alt={resolvedEntities.remix.shortCode}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-[11px] font-medium text-[#1C1917] truncate">
                        {resolvedEntities.mockup
                          ? `Mockup: ${resolvedEntities.mockup.productType.replace(/_/g, ' ')}`
                          : `Remix: ${resolvedEntities.remix.shortCode}`}
                      </p>
                    </div>
                  </div>

                  <dl className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                    <div>
                      <dt className="text-[11px] uppercase tracking-widest text-[#78716C]">
                        Original Artist
                      </dt>
                      <dd className="font-medium text-[#1C1917] mt-0.5">
                        {resolvedEntities.motif.artistName}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[11px] uppercase tracking-widest text-[#78716C]">
                        Original Motif
                      </dt>
                      <dd className="font-medium text-[#1C1917] mt-0.5">
                        {resolvedEntities.motif.title} ({resolvedEntities.motif.artStyle})
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[11px] uppercase tracking-widest text-[#78716C]">
                        Remix Details
                      </dt>
                      <dd className="text-[#1C1917] mt-0.5 capitalize">
                        {resolvedEntities.remix.variationType.replace(/_/g, ' ')} · By{' '}
                        {resolvedEntities.remix.remixerName} ({resolvedEntities.remix.resolution})
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[11px] uppercase tracking-widest text-[#78716C]">
                        License & Date
                      </dt>
                      <dd className="text-[#1C1917] mt-0.5">
                        {LICENSE_META[activeRecord.license].label} ·{' '}
                        {new Date(activeRecord.createdAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="p-4 bg-[#1C1917] text-[#FBF9F5] rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-[#FDBA74] shrink-0" aria-hidden="true" />
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-[#D6CEBE]">
                        Canonical Attribution Line
                      </div>
                      <div className="font-serif text-base font-medium text-white">
                        Inspired by {resolvedEntities.motif.artistName} |{' '}
                        {resolvedEntities.motif.artStyle} | {activeRecord.remixShortCode}
                      </div>
                    </div>
                  </div>
                  <div className="font-mono text-xs text-[#FDBA74] shrink-0">
                    {activeRecord.certificateCode}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Recorded Provenance Ledger */}
          <section className="pt-6 border-t border-[#E5DEC9] space-y-4 no-print">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl font-medium text-[#1C1917]">
                All Recorded Provenance Chains
              </h2>
              <span className="font-mono text-xs text-[#57534E] tabular-nums">
                {provenanceRecords.length} records
              </span>
            </div>

            <div className="bg-white border border-[#E5DEC9] rounded-lg overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7F4EE] border-b border-[#E5DEC9] text-[#57534E] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Remix ID</th>
                    <th className="py-3 px-4 font-semibold">Certificate</th>
                    <th className="py-3 px-4 font-semibold">Original Artist</th>
                    <th className="py-3 px-4 font-semibold">Style</th>
                    <th className="py-3 px-4 font-semibold">Chain Stages</th>
                    <th className="py-3 px-4 font-semibold">Recorded</th>
                    <th className="py-3 px-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2EDE2]">
                  {provenanceRecords.map((rec) => {
                    const isSelected = rec.id === activeRecord.id;
                    return (
                      <tr
                        key={rec.id}
                        className={isSelected ? 'bg-[#FBF9F5]' : 'hover:bg-[#FBF9F5]/60'}
                      >
                        <td className="py-3 px-4 font-mono font-semibold text-[#9A3412]">
                          {rec.remixShortCode}
                        </td>
                        <td className="py-3 px-4 font-mono text-[#1C1917]">
                          {rec.certificateCode}
                        </td>
                        <td className="py-3 px-4 font-medium text-[#1C1917]">{rec.artistName}</td>
                        <td className="py-3 px-4 text-[#57534E]">{rec.artStyle}</td>
                        <td className="py-3 px-4 text-[#44403C] tabular-nums">
                          {rec.chain.length} nodes {rec.mockupId ? '(with Mockup)' : '(Remix only)'}
                        </td>
                        <td className="py-3 px-4 font-mono text-[#78716C] tabular-nums">
                          {formatDateTime(rec.createdAt)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              onSelectProvenance(rec.id);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="text-xs font-semibold text-[#9A3412] hover:underline cursor-pointer"
                          >
                            {isSelected ? 'Viewing' : 'Inspect Tree'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
};
