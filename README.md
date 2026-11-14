# Folk Art Remix with Credit

**Built for the GenNarrative Clash Hackathon — Kolkata**

An attribution-first AI heritage archive and design studio where Bengali folk artisans (Patachitra, Alpona, Nakshi Kantha, Kalighat, Dokra) share motifs on their own terms—enforcing consent licenses, surfacing cultural meaning, baking permanent artist credit into product mockups, and generating verifiable provenance certificates.

---

## 1. Problem Statement

Generative AI can imitate traditional South Asian folk art in seconds, often stripping away the artisan's name, regional story, ritual meaning, and economic opportunity. **Folk Art Remix with Credit** solves this by embedding consent, cultural context, and immutable attribution directly into the creative pipeline.

---

## 2. Core User Flows

### A. Artist / Artisan
1. **Upload & Auto-Document (`Artist Upload`)**: Upload a motif image alongside title, art style, region, cultural story, optional social handle, and optional UPI ID.
2. **Gemini Archival Analysis**: Upon upload, Gemini inspects the artwork and drafts a **motif description**, **detected style**, **dominant pigment colors** (name + hex), and a **2-line cultural note**—all editable by the artist before publishing.
3. **Consent & Licensing**: Choose `Remix Allowed`, `Remix with Credit`, or `Not Allowed`, and confirm authorship consent.
4. **Impact Tracking & Live Control (`Dashboard`)**: Track remix counts, view remixer names and downstream product mockups, and change a motif's license at any time (future remixes follow the new rule while past provenance records remain intact).

### B. Remixer / Designer
1. **Explore & Filter (`Library`)**: Browse motifs by art style (`Patachitra`, `Alpona`, `Kantha`, `Kalighat`, `Dokra`, `Other`), license status, or keyword search.
2. **Cultural Note Gate (`Remix`)**: Before unlocking controls, the designer must read and acknowledge the motif's cultural meaning. Motifs marked `Not Allowed` are strictly blocked.
3. **Generate Variations**: Choose from 5 variation modes (**Color Palette Shift**, **Pattern Tiling**, **Modern / Simplified**, **Mix with Second Motif**, **Mood & Atmosphere**), set resolution (`1K`, `2K`, or `4K`) and count (`3` or `4`), and generate culturally faithful variations via Gemini.
4. **Save with Lineage**: Selecting a variation saves a `Remix` record with a short unique ID (`RMX-XXXX`) and links it to its parent motif(s) and `ProvenanceRecord`.
5. **Product Mockups (`Mockups`)**: Place any saved remix onto **T-Shirt**, **Tote Bag**, **Saree Border**, **Mug**, **Poster**, or **Phone Case** templates with baked-in attribution and download as PNG.

### C. Viewer / Buyer / Verifier
1. **Verify Attribution (`Provenance`)**: Enter any short Remix ID (`RMX-XXXX`) or Certificate Code (`FARC-YYYY-XXXX`) to inspect the 3-stage visual tree (**Original Motif → AI Remix → Product Mockup**), timestamps, and the recorded AI prompt.
2. **Download Credit Certificate**: Export a high-resolution PNG **Certificate of Cultural Attribution** or print/save as PDF.
3. **Thank & Support Artist**: Click **Thank / Support Artist** on the Dashboard, Library, or Mockup Studio to copy the artisan's UPI handle, contact info, and an appreciation note.

---

## 3. Ethical Guardrails Enforced in Code

- **Hard License Block**: Motifs licensed as `not_allowed` are excluded from dual-motif blending, disabled in the Remix Studio UI, and rejected with HTTP `403` by `POST /api/gemini/generate-remix`.
- **Mandatory Cultural Note Gate**: Remix generation controls stay locked until the user acknowledges the motif's cultural meaning.
- **Living-Artist Imitation Warning**: `checkLivingArtistImitation` in `src/utils/ethics.ts` warns designers if their prompt attempts to mimic a named living/modern artist without consent.
- **Unremovable Baked-In Credit**: HTML5 Canvas compositing (`src/utils/mockupCanvas.ts`) renders `"Inspired by [Artist Name] | [Style] | [Remix ID]"` directly into the exported PNG pixels so credit cannot be stripped.
- **Immutable Historical Records**: Changing a motif's license on the Artist Dashboard only governs new remixes; existing `Remix` and `ProvenanceRecord` snapshots preserve their original license terms.

---

## 4. Tech Stack & Gemini API Architecture

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React, HTML5 Canvas, `localStorage` persistence (pre-seeded with 6 Bengali folk art motifs).
- **Backend**: Express + Vite middleware (`server.ts`) keeping `GEMINI_API_KEY` strictly server-side using `@google/genai`.

### Server-Side Gemini Endpoints (`server.ts`)
| Endpoint | Model | Purpose |
|---|---|---|
| `POST /api/gemini/analyze-motif` | `gemini-4-hydrogen` | Multimodal image analysis returning structured JSON (`motifDescription`, `detectedStyle`, `dominantColors`, `culturalNote`). |
| `POST /api/gemini/generate-remix` | `gemini-nano-banana-2.1` | Generates 3–4 motif variations (`1K` / `2K` / `4K`) using the Cultural Preservation Prompt Template; enforces `not_allowed` license check. |
| `POST /api/gemini/product-caption` | `gemini-4-hydrogen` | Drafts optional 2-sentence buyer-facing ethical product descriptions. |
| `POST /api/gemini/chat` | `gemini-4-hydrogen` | Multi-turn **Cultural Heritage Guide** assistant with motif-aware system instructions. |

---

## 5. Project Structure

```text
├── server.ts                          # Express + Vite server & server-side @google/genai routes
├── index.html                         # Entry HTML & Fraunces / Plus Jakarta Sans / JetBrains Mono fonts
├── metadata.json                      # App manifest & server-side Gemini capability declaration
├── package.json                       # Scripts (dev, build, start, lint) and dependencies
└── src/
    ├── App.tsx                        # Top-level routing, shared archive state, banners & modals
    ├── index.css                      # Tailwind v4 theme & @media print PDF certificate styles
    ├── types.ts                       # Artist, Motif, Remix, Mockup & ProvenanceRecord schemas
    ├── data/
    │   └── seedMotifs.ts              # 6 starter Bengali folk motifs (Patachitra, Alpona, Kantha, Kalighat, Dokra)
    ├── utils/
    │   ├── storage.ts                 # localStorage CRUD, image compression & provenance helpers
    │   ├── ethics.ts                  # Cultural prompt template, credit formatter & imitation checks
    │   ├── mockupCanvas.ts            # 6-product Canvas compositor with baked-in credit bar
    │   └── certificateCanvas.ts       # High-DPI Certificate of Cultural Attribution PNG renderer
    └── components/
        ├── Navbar.tsx                 # Single-row 3-zone navigation header
        ├── MotifLibraryPage.tsx       # Bengali Alpona terracotta hero, 3-step guide, filters & motif modal
        ├── ArtistUploadPage.tsx       # Artisan upload form with editable Gemini auto-analysis
        ├── RemixStudioPage.tsx        # Cultural note gate, license guardrails & 3-4 variation generator
        ├── MockupStudioPage.tsx       # 6-product live Canvas previewer & baked-in PNG export
        ├── ProvenancePage.tsx         # RMX-XXXX ID verifier, 3-stage visual tree & Credit Certificate
        ├── ArtistDashboardPage.tsx    # Per-artist remix counts, product tracking & live license controls
        ├── SupportArtistModal.tsx     # Thank You / Support Artist modal with UPI & contact copy
        └── CulturalChatDrawer.tsx     # Multi-turn Gemini Cultural Heritage Guide drawer
```

---

## 6. Local Setup & Running

### Prerequisites
- Node.js 20+
- A `GEMINI_API_KEY` from Google AI Studio (note: high-resolution image generation with `gemini-nano-banana-2.1` requires a billing-enabled API key).

### Install & Run in Development
```bash
npm install
export GEMINI_API_KEY="your_gemini_api_key"
npm run dev
```
Open `http://localhost:3000` in your browser.

### Build & Run in Production
```bash
npm run build
npm start
```

### Type-Check
```bash
npm run lint
```

---

## 7. Quick Hackathon Demo Checklist

1. **Seed Data Ready**: 6 Bengali motifs load automatically (`Swarna Chitrakar`, `Ananya Basu`, `Rehana Begum`, `Debashis Paul`, `Anwar Chitrakar`, `Gopal Karmakar`).
2. **Test Protected License**: Open *Kalighat Calligraphic Peacock* (`Not Allowed`) in Remix Studio to demonstrate hard license blocking.
3. **Test Cultural Gate & Remix**: Open *Auspicious Matsya & Lotus Scroll*, acknowledge the cultural note, generate variations, and save a remix (`RMX-XXXX`).
4. **Test Mockup & Baked-In Credit**: Place the saved remix on a **Saree Border** or **Tote Bag** and download the PNG to show the unremovable attribution footer.
5. **Verify & Download Certificate**: Open **Provenance**, verify the `RMX-XXXX` ID, inspect the 3-stage lineage tree, and download the Credit Certificate PNG.
6. **Live License Update**: Open **Dashboard**, switch a motif's license, and show **Thank You / Support Artist** with direct UPI details.
