import React, { useState } from 'react';
import { Check, Copy, Heart, Mail, Wallet, X } from 'lucide-react';
import type { Artist } from '../types';

interface SupportArtistModalProps {
  artist: Pick<
    Artist,
    'name' | 'region' | 'primaryStyle' | 'contactOrHandle' | 'upiId'
  > | null;
  motifTitle?: string;
  onClose: () => void;
}

export const SupportArtistModal: React.FC<SupportArtistModalProps> = ({
  artist,
  motifTitle,
  onClose,
}) => {
  const [copiedField, setCopiedField] = useState<'upi' | 'contact' | 'note' | null>(null);

  if (!artist) return null;

  const thankYouNote = motifTitle
    ? `Thank you, ${artist.name}, for sharing "${motifTitle}" (${artist.primaryStyle}, ${artist.region}). Your visual heritage inspired our adaptation and carries your full attribution.`
    : `Thank you, ${artist.name}, for preserving ${artist.primaryStyle} folk heritage from ${artist.region}.`;

  const handleCopy = (field: 'upi' | 'contact' | 'note', value: string) => {
    navigator.clipboard?.writeText(value).catch(() => {});
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1600);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[1px] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="support-artist-title"
      onClick={onClose}
    >
      <div
        className="bg-[#FBF9F5] border border-[#D6CEBE] rounded-lg max-w-md w-full p-6 space-y-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E5DEC9]">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-[#9A3412] font-semibold">
              <Heart className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Thank You & Direct Support</span>
            </div>
            <h2
              id="support-artist-title"
              className="font-serif text-2xl font-medium text-[#1C1917]"
            >
              {artist.name}
            </h2>
            <p className="text-xs text-[#78716C]">
              {artist.primaryStyle} · {artist.region}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close support artist modal"
            className="p-1.5 text-[#57534E] hover:text-[#1C1917] rounded-md cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {artist.upiId ? (
            <div className="p-3.5 bg-white border border-[#E5DEC9] rounded-md flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-[#78716C]">
                  <Wallet className="w-3.5 h-3.5 text-[#9A3412]" aria-hidden="true" />
                  <span>Direct UPI Handle</span>
                </div>
                <p className="font-mono text-sm font-medium text-[#1C1917] truncate mt-0.5">
                  {artist.upiId}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy('upi', artist.upiId!)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#1C1917] bg-[#F2EDE2] hover:bg-[#E5DEC9] rounded-md cursor-pointer shrink-0"
              >
                {copiedField === 'upi' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#14532D]" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy UPI
                  </>
                )}
              </button>
            </div>
          ) : null}

          {artist.contactOrHandle ? (
            <div className="p-3.5 bg-white border border-[#E5DEC9] rounded-md flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-[#78716C]">
                  <Mail className="w-3.5 h-3.5 text-[#9A3412]" aria-hidden="true" />
                  <span>Contact / Social Handle</span>
                </div>
                <p className="text-sm font-medium text-[#1C1917] truncate mt-0.5">
                  {artist.contactOrHandle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy('contact', artist.contactOrHandle!)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#1C1917] bg-[#F2EDE2] hover:bg-[#E5DEC9] rounded-md cursor-pointer shrink-0"
              >
                {copiedField === 'contact' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#14532D]" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </>
                )}
              </button>
            </div>
          ) : null}

          {!artist.upiId && !artist.contactOrHandle && (
            <div className="p-4 bg-white border border-[#E5DEC9] rounded-md text-xs text-[#57534E] leading-relaxed">
              This artist has not listed a public UPI ID or social handle yet. You can still honor
              their craft by keeping their full attribution line on every derivative and mockup.
            </div>
          )}
        </div>

        <div className="p-4 bg-[#F7F4EE] border border-[#E5DEC9] rounded-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-widest text-[#78716C] font-semibold">
              Appreciation Message
            </span>
            <button
              type="button"
              onClick={() => handleCopy('note', thankYouNote)}
              className="text-xs font-medium text-[#9A3412] hover:underline cursor-pointer"
            >
              {copiedField === 'note' ? 'Copied message' : 'Copy message'}
            </button>
          </div>
          <p className="text-xs font-serif italic text-[#292524] leading-relaxed">
            “{thankYouNote}”
          </p>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#FBF9F5] bg-[#1C1917] hover:bg-[#9A3412] rounded-md transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
