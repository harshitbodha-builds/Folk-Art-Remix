import React from 'react';

export type ActiveView =
  | 'library'
  | 'remix'
  | 'mockup'
  | 'provenance'
  | 'dashboard'
  | 'upload';

interface NavbarProps {
  activeView: ActiveView;
  onNavigate: (view: ActiveView) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeView, onNavigate }) => {
  return (
    <header className="sticky top-0 z-30 bg-[#FBF9F5]/95 backdrop-blur-sm border-b border-[#E5DEC9] no-print">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
        <button
          type="button"
          onClick={() => onNavigate('library')}
          className="font-serif text-xl font-semibold tracking-tight text-[#1C1917] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9A3412] rounded-sm"
        >
          Folk Art Remix
        </button>

        <nav className="flex items-center gap-6 text-sm font-medium text-[#57534E] overflow-x-auto">
          <button
            type="button"
            onClick={() => onNavigate('library')}
            className={`whitespace-nowrap shrink-0 py-1 transition-colors cursor-pointer border-b-2 ${
              activeView === 'library'
                ? 'text-[#1C1917] border-[#9A3412]'
                : 'border-transparent hover:text-[#1C1917]'
            }`}
          >
            Library
          </button>
          <button
            type="button"
            onClick={() => onNavigate('remix')}
            className={`whitespace-nowrap shrink-0 py-1 transition-colors cursor-pointer border-b-2 ${
              activeView === 'remix'
                ? 'text-[#1C1917] border-[#9A3412]'
                : 'border-transparent hover:text-[#1C1917]'
            }`}
          >
            Remix
          </button>
          <button
            type="button"
            onClick={() => onNavigate('mockup')}
            className={`whitespace-nowrap shrink-0 py-1 transition-colors cursor-pointer border-b-2 ${
              activeView === 'mockup'
                ? 'text-[#1C1917] border-[#9A3412]'
                : 'border-transparent hover:text-[#1C1917]'
            }`}
          >
            Mockups
          </button>
          <button
            type="button"
            onClick={() => onNavigate('provenance')}
            className={`whitespace-nowrap shrink-0 py-1 transition-colors cursor-pointer border-b-2 ${
              activeView === 'provenance'
                ? 'text-[#1C1917] border-[#9A3412]'
                : 'border-transparent hover:text-[#1C1917]'
            }`}
          >
            Provenance
          </button>
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className={`whitespace-nowrap shrink-0 py-1 transition-colors cursor-pointer border-b-2 ${
              activeView === 'dashboard'
                ? 'text-[#1C1917] border-[#9A3412]'
                : 'border-transparent hover:text-[#1C1917]'
            }`}
          >
            Dashboard
          </button>
        </nav>

        <div className="shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('upload')}
            className="px-4 py-2 text-xs font-semibold text-[#FBF9F5] bg-[#9A3412] hover:bg-[#7C2D12] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#9A3412]"
          >
            Upload Motif
          </button>
        </div>
      </div>
    </header>
  );
};
