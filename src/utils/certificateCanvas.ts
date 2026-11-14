import type { Mockup, Motif, ProvenanceRecord, Remix } from '../types';
import { LICENSE_META } from './storage';

function loadImageSafe(src?: string): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawImageFitSquare(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  size: number,
) {
  const ratio = img.width / img.height;
  let sx = 0;
  let sy = 0;
  let sw = img.width;
  let sh = img.height;
  if (ratio > 1) {
    sw = img.height;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, size, size);
}

function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines = 2,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
      if (lines.length === maxLines) break;
    } else {
      current = test;
    }
  }
  if (current && lines.length < maxLines) {
    lines.push(current);
  }
  return lines;
}

export async function renderCreditCertificateDataUrl(params: {
  provenance: ProvenanceRecord;
  motif: Motif;
  secondaryMotif?: Motif | null;
  remix: Remix;
  mockup?: Mockup | null;
}): Promise<string> {
  const W = 1400;
  const H = 980;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context is unavailable.');
  }

  const [motifImg, remixImg, mockupImg] = await Promise.all([
    loadImageSafe(params.motif.imageDataUrl),
    loadImageSafe(params.remix.imageDataUrl),
    loadImageSafe(params.mockup?.imageDataUrl),
  ]);

  // Archival paper base
  ctx.fillStyle = '#FBF9F5';
  ctx.fillRect(0, 0, W, H);

  // Outer museum double frame
  ctx.strokeStyle = '#1C1917';
  ctx.lineWidth = 4;
  ctx.strokeRect(36, 36, W - 72, H - 72);

  ctx.strokeStyle = '#9A3412';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(52, 52, W - 104, H - 104);

  // Header Banner
  ctx.fillStyle = '#9A3412';
  ctx.font = '600 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('FOLK ART REMIX WITH CREDIT  ·  KOLKATA CULTURAL ARCHIVE', W / 2, 108);

  ctx.fillStyle = '#1C1917';
  ctx.font = '600 44px Georgia, serif';
  ctx.fillText('Certificate of Cultural Attribution', W / 2, 162);

  ctx.fillStyle = '#57534E';
  ctx.font = '18px Georgia, serif';
  ctx.fillText(
    'Verified provenance record binding derivative design to original artisan heritage',
    W / 2,
    200,
  );

  // Hairline divider
  ctx.strokeStyle = '#D6CEBE';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(96, 230);
  ctx.lineTo(W - 96, 230);
  ctx.stroke();

  // Left Visual Lineage Thumbnails
  const thumbY = 266;
  const thumbSize = 205;
  const slots: Array<{ title: string; subtitle: string; img: HTMLImageElement | null; x: number }> = [
    {
      title: '1. Original Motif',
      subtitle: params.motif.artistName,
      img: motifImg,
      x: 96,
    },
    {
      title: '2. AI Remix',
      subtitle: params.remix.shortCode || params.remix.id,
      img: remixImg,
      x: 330,
    },
  ];

  if (mockupImg && params.mockup) {
    slots.push({
      title: '3. Product Mockup',
      subtitle: params.mockup.productType.replace(/_/g, ' '),
      img: mockupImg,
      x: 564,
    });
  }

  for (const slot of slots) {
    ctx.fillStyle = '#EBE6DF';
    ctx.fillRect(slot.x, thumbY, thumbSize, thumbSize);
    if (slot.img) {
      drawImageFitSquare(ctx, slot.img, slot.x, thumbY, thumbSize);
    }
    ctx.strokeStyle = '#C7BDA9';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(slot.x, thumbY, thumbSize, thumbSize);

    ctx.fillStyle = '#1C1917';
    ctx.font = '600 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(slot.title, slot.x, thumbY + thumbSize + 24);

    ctx.fillStyle = '#57534E';
    ctx.font = '13px monospace';
    ctx.fillText(slot.subtitle.slice(0, 26), slot.x, thumbY + thumbSize + 44);
  }

  // Right Structured Metadata Table
  const metaX = mockupImg ? 816 : 585;
  const metaW = W - 96 - metaX;
  let curY = 278;

  const rows: Array<[string, string]> = [
    ['ORIGINAL ARTIST', `${params.motif.artistName} (${params.motif.region})`],
    [
      'ORIGINAL MOTIF',
      `${params.motif.title} · ${params.motif.artStyle}${
        params.secondaryMotif ? ` + ${params.secondaryMotif.title}` : ''
      }`,
    ],
    [
      'REMIX DETAILS',
      `${params.remix.variationType.replace(/_/g, ' ')} · ${params.remix.resolution} · By ${
        params.remix.remixerName
      }`,
    ],
    ['REMIX UNIQUE ID', `${params.remix.shortCode} (Ref: ${params.remix.id})`],
    ['LICENSE TERMS', LICENSE_META[params.provenance.license].label],
    [
      'DATE RECORDED',
      new Date(params.provenance.createdAt).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    ],
  ];

  for (const [label, value] of rows) {
    ctx.fillStyle = '#78716C';
    ctx.font = '600 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(label, metaX, curY);

    ctx.fillStyle = '#1C1917';
    ctx.font = '500 17px Georgia, serif';
    const wrapped = wrapTextLines(ctx, value, metaW, 2);
    wrapped.forEach((line, idx) => {
      ctx.fillText(line, metaX, curY + 23 + idx * 22);
    });

    curY += 23 + wrapped.length * 22 + 16;
  }

  // Lower Cultural Attribution Seal Box
  const boxY = 740;
  ctx.fillStyle = '#1C1917';
  ctx.fillRect(96, boxY, W - 192, 118);
  ctx.fillStyle = '#9A3412';
  ctx.fillRect(96, boxY, W - 192, 5);

  ctx.fillStyle = '#D6CEBE';
  ctx.font = '600 12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('REQUIRED PERMANENT ATTRIBUTION LINE', 128, boxY + 36);

  ctx.fillStyle = '#FBF9F5';
  ctx.font = '600 24px Georgia, serif';
  ctx.fillText(
    `Inspired by ${params.motif.artistName} | ${params.motif.artStyle} | ${params.remix.shortCode}`,
    128,
    boxY + 78,
    W - 480,
  );

  // Verification Code Pill on Right of Dark Band
  ctx.textAlign = 'right';
  ctx.fillStyle = '#D6CEBE';
  ctx.font = '600 12px sans-serif';
  ctx.fillText('CERTIFICATE CODE', W - 128, boxY + 36);

  ctx.fillStyle = '#FDBA74';
  ctx.font = '600 24px monospace';
  ctx.fillText(params.provenance.certificateCode, W - 128, boxY + 78);

  // Footer
  ctx.textAlign = 'left';
  ctx.fillStyle = '#78716C';
  ctx.font = '13px sans-serif';
  ctx.fillText(
    `Verify anytime in Folk Art Remix Archive using ID: ${params.remix.shortCode} or ${params.provenance.certificateCode}`,
    96,
    904,
  );

  ctx.textAlign = 'right';
  ctx.fillText('Ethical Heritage Provenance Ledger', W - 96, 904);

  return canvas.toDataURL('image/png');
}
