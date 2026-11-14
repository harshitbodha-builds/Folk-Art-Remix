import { useState } from 'react';
import { CheckCircle2, MessageCircle } from 'lucide-react';
import { Navbar, type ActiveView } from './components/Navbar';
import { MotifLibraryPage } from './components/MotifLibraryPage';
import { ArtistUploadPage } from './components/ArtistUploadPage';
import { RemixStudioPage } from './components/RemixStudioPage';
import { MockupStudioPage } from './components/MockupStudioPage';
import { ProvenancePage } from './components/ProvenancePage';
import { ArtistDashboardPage } from './components/ArtistDashboardPage';
import { CulturalChatDrawer } from './components/CulturalChatDrawer';
import { SupportArtistModal } from './components/SupportArtistModal';
import type {
  Artist,
  LicenseType,
  Mockup,
  Motif,
  ProvenanceRecord,
  Remix,
} from './types';
import {
  loadArtists,
  loadMockups,
  loadMotifs,
  loadProvenance,
  loadRemixes,
  resetArchiveToDemo,
  updateMotifLicense,
} from './utils/storage';

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('library');
  const [artists, setArtists] = useState<Artist[]>(() => loadArtists());
  const [motifs, setMotifs] = useState<Motif[]>(() => loadMotifs());
  const [remixes, setRemixes] = useState<Remix[]>(() => loadRemixes());
  const [mockups, setMockups] = useState<Mockup[]>(() => loadMockups());
  const [provenanceRecords, setProvenanceRecords] = useState<ProvenanceRecord[]>(() =>
    loadProvenance(),
  );
  const [selectedMotifIdForRemix, setSelectedMotifIdForRemix] = useState<string | null>(
    () => loadMotifs().find((m) => m.license !== 'not_allowed')?.id ?? loadMotifs()[0]?.id ?? null,
  );
  const [selectedRemixIdForMockup, setSelectedRemixIdForMockup] = useState<string | null>(
    () => loadRemixes()[0]?.id ?? null,
  );
  const [selectedProvenanceId, setSelectedProvenanceId] = useState<string | null>(
    () => loadProvenance()[0]?.id ?? null,
  );
  const [chatOpen, setChatOpen] = useState(false);
  const [chatContextMotif, setChatContextMotif] = useState<Motif | null>(null);
  const [supportTarget, setSupportTarget] = useState<{
    artist: Pick<Artist, 'name' | 'region' | 'primaryStyle' | 'contactOrHandle' | 'upiId'>;
    motifTitle?: string;
  } | null>(null);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  const syncAllRecords = () => {
    setArtists(loadArtists());
    setMotifs(loadMotifs());
    setRemixes(loadRemixes());
    setMockups(loadMockups());
    setProvenanceRecords(loadProvenance());
  };

  const handleMotifSaved = (savedMotif: Motif) => {
    syncAllRecords();
    setSelectedMotifIdForRemix(savedMotif.id);
    setActiveView('library');
    setBannerMessage(
      `Published "${savedMotif.title}" by ${savedMotif.artistName} to the Motif Library.`,
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenRemix = (motif: Motif) => {
    setSelectedMotifIdForRemix(motif.id);
    setActiveView('remix');
    setBannerMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRemixSaved = (remix: Remix, provenance: ProvenanceRecord) => {
    syncAllRecords();
    setSelectedRemixIdForMockup(remix.id);
    setSelectedProvenanceId(provenance.id);
    setBannerMessage(
      `Saved remix ${remix.shortCode} (Certificate ${provenance.certificateCode}) with permanent credit: "${remix.creditLine}".`,
    );
  };

  const handleOpenMockup = (remixId: string) => {
    setSelectedRemixIdForMockup(remixId);
    setActiveView('mockup');
    setBannerMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMockupSaved = (mockup: Mockup) => {
    const latestProvenance = loadProvenance();
    syncAllRecords();
    const matched = latestProvenance.find((p) => p.mockupId === mockup.id);
    if (matched) {
      setSelectedProvenanceId(matched.id);
    }
    setBannerMessage(
      `Saved ${mockup.productType.replace(/_/g, ' ')} mockup (${mockup.id}) and updated provenance chain.`,
    );
  };

  const handleOpenProvenanceByRemix = (remixId: string) => {
    const latest = loadProvenance();
    setProvenanceRecords(latest);
    const matched = latest.find((p) => p.remixId === remixId);
    if (matched) {
      setSelectedProvenanceId(matched.id);
    }
    setActiveView('provenance');
    setBannerMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleChangeMotifLicense = (motifId: string, newLicense: LicenseType) => {
    const updated = updateMotifLicense(motifId, newLicense);
    setMotifs(updated);
  };

  const handleSupportFromMotif = (motif: Motif) => {
    const artist = artists.find((a) => a.id === motif.artistId);
    setSupportTarget({
      artist: artist ?? {
        name: motif.artistName,
        region: motif.region,
        primaryStyle: motif.artStyle,
        contactOrHandle: motif.contactOrHandle,
        upiId: motif.upiId,
      },
      motifTitle: motif.title,
    });
  };

  const handleResetDemo = () => {
    const restored = resetArchiveToDemo();
    setMotifs(restored);
    setArtists(loadArtists());
    setBannerMessage('Restored starter Bengali folk art motifs.');
  };

  const handleAskGuideAboutMotif = (motif: Motif) => {
    setChatContextMotif(motif);
    setChatOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF9F5] text-[#1C1917]">
      <Navbar
        activeView={activeView}
        onNavigate={(view) => {
          setActiveView(view);
          setBannerMessage(null);
        }}
      />

      {bannerMessage && (
        <div className="bg-[#ECFDF5] border-b border-[#A7F3D0] no-print">
          <div className="max-w-7xl mx-auto px-6 py-2.5 flex items-center justify-between gap-4 text-xs text-[#065F46]">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{bannerMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setBannerMessage(null)}
              className="underline hover:no-underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <main className="flex-1">
        {activeView === 'library' && (
          <MotifLibraryPage
            motifs={motifs}
            onGoToUpload={() => setActiveView('upload')}
            onOpenRemix={handleOpenRemix}
            onResetDemo={handleResetDemo}
            onAskGuideAboutMotif={handleAskGuideAboutMotif}
            onSupportArtist={handleSupportFromMotif}
          />
        )}
        {activeView === 'remix' && (
          <RemixStudioPage
            motifs={motifs}
            selectedMotifId={selectedMotifIdForRemix}
            remixes={remixes}
            onSelectMotif={(id) => setSelectedMotifIdForRemix(id)}
            onRemixSaved={handleRemixSaved}
            onOpenMockup={handleOpenMockup}
            onOpenProvenanceByRemix={handleOpenProvenanceByRemix}
            onBackToLibrary={() => setActiveView('library')}
          />
        )}
        {activeView === 'mockup' && (
          <MockupStudioPage
            motifs={motifs}
            remixes={remixes}
            mockups={mockups}
            selectedRemixId={selectedRemixIdForMockup}
            onSelectRemix={(id) => setSelectedRemixIdForMockup(id)}
            onRemixCreated={() => syncAllRecords()}
            onMockupSaved={handleMockupSaved}
            onGoToRemixStudio={(motifId) => {
              if (motifId) setSelectedMotifIdForRemix(motifId);
              setActiveView('remix');
            }}
            onOpenProvenanceByRemix={handleOpenProvenanceByRemix}
            onSupportArtist={handleSupportFromMotif}
          />
        )}
        {activeView === 'provenance' && (
          <ProvenancePage
            motifs={motifs}
            remixes={remixes}
            mockups={mockups}
            provenanceRecords={provenanceRecords}
            selectedProvenanceId={selectedProvenanceId}
            onSelectProvenance={(id) => setSelectedProvenanceId(id)}
            onGoToRemixStudio={() => setActiveView('remix')}
            onGoToMockupStudio={handleOpenMockup}
          />
        )}
        {activeView === 'dashboard' && (
          <ArtistDashboardPage
            artists={artists}
            motifs={motifs}
            remixes={remixes}
            mockups={mockups}
            onChangeMotifLicense={handleChangeMotifLicense}
            onOpenSupportArtist={(artist, motifTitle) =>
              setSupportTarget({ artist, motifTitle })
            }
            onOpenProvenanceByRemix={handleOpenProvenanceByRemix}
            onGoToUpload={() => setActiveView('upload')}
          />
        )}
        {activeView === 'upload' && (
          <ArtistUploadPage
            onMotifSaved={handleMotifSaved}
            onCancel={() => setActiveView('library')}
          />
        )}
      </main>

      <footer className="border-t border-[#E5DEC9] py-6 px-6 text-xs text-[#78716C] no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>Folk Art Remix with Credit · Kolkata GenNarrative Archive</span>
          <span>Attribution is permanently preserved on every derivative work.</span>
        </div>
      </footer>

      <button
        type="button"
        onClick={() => {
          setChatContextMotif(
            activeView === 'remix'
              ? motifs.find((m) => m.id === selectedMotifIdForRemix) ?? null
              : null,
          );
          setChatOpen(true);
        }}
        className="fixed bottom-5 right-5 z-30 no-print inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#FBF9F5] bg-[#1C1917] hover:bg-[#9A3412] rounded-lg shadow-lg transition-colors cursor-pointer whitespace-nowrap"
      >
        <MessageCircle className="w-4 h-4" aria-hidden="true" />
        Cultural Guide
      </button>

      <CulturalChatDrawer
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        activeMotif={chatContextMotif}
      />

      <SupportArtistModal
        artist={supportTarget?.artist ?? null}
        motifTitle={supportTarget?.motifTitle}
        onClose={() => setSupportTarget(null)}
      />
    </div>
  );
}
