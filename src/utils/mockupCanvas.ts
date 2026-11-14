import type { ProductType } from '../types';

export interface ProductOptionMeta {
  id: ProductType;
  label: string;
  subtitle: string;
  placementNote: string;
}

export const PRODUCT_OPTIONS: ProductOptionMeta[] = [
  {
    id: 'tshirt',
    label: 'T-Shirt',
    subtitle: 'Chest print on handloom cotton tee',
    placementNote: 'Centered chest emblem',
  },
  {
    id: 'tote_bag',
    label: 'Tote Bag',
    subtitle: 'Heavy unbleached canvas carryall',
    placementNote: 'Full front panel print',
  },
  {
    id: 'saree_border',
    label: 'Saree Border',
    subtitle: 'Handloom drape with repeating paar border',
    placementNote: 'Continuous horizontal border repeat',
  },
  {
    id: 'mug',
    label: 'Mug',
    subtitle: 'Stoneware ceramic wraparound print',
    placementNote: 'Curved cylindrical wrap',
  },
  {
    id: 'poster',
    label: 'Poster',
    subtitle: 'Archival cotton-rag museum print',
    placementNote: 'Framed gallery mat with title',
  },
  {
    id: 'phone_case',
    label: 'Phone Case',
    subtitle: 'Matte protective shell with full-bleed back',
    placementNote: 'Vertical rear cover placement',
  },
];

export type ProductTone = 'ivory' | 'charcoal' | 'indigo' | 'terracotta';

export const PRODUCT_TONES: Array<{ id: ProductTone; label: string; fill: string; shade: string; stroke: string }> = [
  { id: 'ivory', label: 'Raw Cotton', fill: '#F7F3EA', shade: '#E5DEC9', stroke: '#C8BFA9' },
  { id: 'charcoal', label: 'Lampblack', fill: '#292524', shade: '#1C1917', stroke: '#44403C' },
  { id: 'indigo', label: 'Bengal Indigo', fill: '#22384F', shade: '#172738', stroke: '#365575' },
  { id: 'terracotta', label: 'Baked Clay', fill: '#9A3412', shade: '#7C2D12', stroke: '#B45309' },
];

export function formatMockupCredit(params: {
  artistName: string;
  artStyle: string;
  remixId: string;
}): string {
  return `Inspired by ${params.artistName} | ${params.artStyle} | ${params.remixId}`;
}

function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Unable to load artwork image for mockup rendering.'));
    img.src = src;
  });
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
) {
  const imgRatio = img.width / img.height;
  const targetRatio = dw / dh;
  let sx = 0;
  let sy = 0;
  let sw = img.width;
  let sh = img.height;

  if (imgRatio > targetRatio) {
    sw = img.height * targetRatio;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / targetRatio;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

export async function renderProductMockupToCanvas(
  canvas: HTMLCanvasElement,
  params: {
    artworkSrc: string;
    productType: ProductType;
    tone: ProductTone;
    artistName: string;
    artStyle: string;
    remixId: string;
    motifTitle: string;
  },
): Promise<string> {
  const W = 1000;
  const H = 1140;
  const FOOTER_H = 116;
  const STAGE_H = H - FOOTER_H;

  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context is unavailable.');
  }

  const artImg = await loadHtmlImage(params.artworkSrc);
  const toneMeta = PRODUCT_TONES.find((t) => t.id === params.tone) ?? PRODUCT_TONES[0];

  // Warm museum gallery background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, STAGE_H);
  bgGrad.addColorStop(0, '#F5F1E8');
  bgGrad.addColorStop(1, '#E8E0D1');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, STAGE_H);

  // Subtle floor shadow under product
  ctx.save();
  ctx.fillStyle = 'rgba(28, 25, 23, 0.08)';
  ctx.beginPath();
  ctx.ellipse(W / 2, STAGE_H - 72, 260, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (params.productType === 'tshirt') {
    // T-Shirt Silhouette
    ctx.save();
    ctx.shadowColor = 'rgba(28, 25, 23, 0.14)';
    ctx.shadowBlur = 28;
    ctx.shadowOffsetY = 14;
    ctx.fillStyle = toneMeta.fill;
    ctx.strokeStyle = toneMeta.stroke;
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(395, 130);
    ctx.quadraticCurveTo(500, 185, 605, 130); // neckline
    ctx.lineTo(745, 175); // right shoulder
    ctx.lineTo(860, 345); // right sleeve outer
    ctx.lineTo(750, 415); // right sleeve inner
    ctx.lineTo(705, 345); // right armpit
    ctx.lineTo(705, 895); // right hem
    ctx.lineTo(295, 895); // bottom hem
    ctx.lineTo(295, 345); // left armpit
    ctx.lineTo(250, 415); // left sleeve inner
    ctx.lineTo(140, 345); // left sleeve outer
    ctx.lineTo(255, 175); // left shoulder
    ctx.closePath();
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.stroke();

    // Collar rib & subtle folds
    ctx.beginPath();
    ctx.moveTo(395, 130);
    ctx.quadraticCurveTo(500, 198, 605, 130);
    ctx.strokeStyle = toneMeta.stroke;
    ctx.lineWidth = 4;
    ctx.stroke();

    // Chest artwork print
    const px = 355;
    const py = 275;
    const pw = 290;
    const ph = 290;
    ctx.save();
    drawRoundedRect(ctx, px, py, pw, ph, 10);
    ctx.clip();
    drawImageCover(ctx, artImg, px, py, pw, ph);
    ctx.restore();

    ctx.strokeStyle = 'rgba(28, 25, 23, 0.14)';
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, px, py, pw, ph, 10);
    ctx.stroke();
    ctx.restore();
  } else if (params.productType === 'tote_bag') {
    // Tote Bag Handles
    ctx.save();
    ctx.strokeStyle = toneMeta.stroke;
    ctx.lineWidth = 28;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(375, 315);
    ctx.bezierCurveTo(375, 115, 625, 115, 625, 315);
    ctx.stroke();

    ctx.strokeStyle = toneMeta.fill;
    ctx.lineWidth = 22;
    ctx.beginPath();
    ctx.moveTo(375, 315);
    ctx.bezierCurveTo(375, 120, 625, 120, 625, 315);
    ctx.stroke();

    // Bag Body
    ctx.shadowColor = 'rgba(28, 25, 23, 0.15)';
    ctx.shadowBlur = 28;
    ctx.shadowOffsetY = 14;
    ctx.fillStyle = toneMeta.fill;
    ctx.strokeStyle = toneMeta.stroke;
    ctx.lineWidth = 3;
    drawRoundedRect(ctx, 255, 300, 490, 585, 18);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.stroke();

    // Top stitched seam
    ctx.setLineDash([7, 7]);
    ctx.strokeStyle = toneMeta.stroke;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(275, 342);
    ctx.lineTo(725, 342);
    ctx.stroke();
    ctx.setLineDash([]);

    // Front Panel Print
    const px = 315;
    const py = 395;
    const pw = 370;
    const ph = 370;
    ctx.save();
    drawRoundedRect(ctx, px, py, pw, ph, 8);
    ctx.clip();
    drawImageCover(ctx, artImg, px, py, pw, ph);
    ctx.restore();

    ctx.strokeStyle = 'rgba(28, 25, 23, 0.16)';
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, px, py, pw, ph, 8);
    ctx.stroke();
    ctx.restore();
  } else if (params.productType === 'saree_border') {
    // Draped Handloom Saree Canvas with Repeating Paar Border
    ctx.save();
    ctx.shadowColor = 'rgba(28, 25, 23, 0.16)';
    ctx.shadowBlur = 28;
    ctx.shadowOffsetY = 12;

    const sx = 120;
    const sy = 155;
    const sw = 760;
    const sh = 720;

    ctx.fillStyle = toneMeta.fill;
    ctx.strokeStyle = toneMeta.stroke;
    ctx.lineWidth = 3;
    drawRoundedRect(ctx, sx, sy, sw, sh, 12);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.stroke();

    // Soft vertical handloom pleat shading
    for (let i = 0; i < 6; i++) {
      const foldX = sx + 85 + i * 115;
      const foldGrad = ctx.createLinearGradient(foldX, sy, foldX + 60, sy);
      foldGrad.addColorStop(0, 'rgba(0,0,0,0)');
      foldGrad.addColorStop(0.5, 'rgba(0,0,0,0.07)');
      foldGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = foldGrad;
      ctx.fillRect(foldX, sy + 2, 60, sh - 4);
    }

    // Woven zari accent bands above and below repeating border
    const borderY = sy + 445;
    const tileSize = 185;
    ctx.fillStyle = '#B45309';
    ctx.fillRect(sx + 2, borderY - 14, sw - 4, 8);
    ctx.fillRect(sx + 2, borderY + tileSize + 6, sw - 4, 8);

    // Repeating horizontal border tiles
    ctx.save();
    ctx.beginPath();
    ctx.rect(sx + 2, borderY, sw - 4, tileSize);
    ctx.clip();
    const numTiles = Math.ceil(sw / tileSize) + 1;
    for (let i = 0; i < numTiles; i++) {
      drawImageCover(ctx, artImg, sx + i * tileSize, borderY, tileSize, tileSize);
    }
    // Re-apply subtle pleat shading across border so it drapes realistically
    for (let i = 0; i < 6; i++) {
      const foldX = sx + 85 + i * 115;
      const foldGrad = ctx.createLinearGradient(foldX, borderY, foldX + 60, borderY);
      foldGrad.addColorStop(0, 'rgba(0,0,0,0)');
      foldGrad.addColorStop(0.5, 'rgba(0,0,0,0.12)');
      foldGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = foldGrad;
      ctx.fillRect(foldX, borderY, 60, tileSize);
    }
    ctx.restore();

    // Pallu corner emblem
    ctx.save();
    const emSize = 135;
    drawRoundedRect(ctx, sx + 565, sy + 75, emSize, emSize, 6);
    ctx.clip();
    drawImageCover(ctx, artImg, sx + 565, sy + 75, emSize, emSize);
    ctx.restore();

    ctx.restore();
  } else if (params.productType === 'mug') {
    // Ceramic Mug Silhouette
    ctx.save();
    // Handle
    ctx.strokeStyle = toneMeta.fill;
    ctx.lineWidth = 44;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(695, 535, 115, -Math.PI * 0.45, Math.PI * 0.45);
    ctx.stroke();

    ctx.strokeStyle = toneMeta.stroke;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(695, 535, 136, -Math.PI * 0.46, Math.PI * 0.46);
    ctx.stroke();

    // Mug Cylinder Body
    ctx.shadowColor = 'rgba(28, 25, 23, 0.16)';
    ctx.shadowBlur = 28;
    ctx.shadowOffsetY = 14;
    ctx.fillStyle = toneMeta.fill;
    ctx.strokeStyle = toneMeta.stroke;
    ctx.lineWidth = 3;
    drawRoundedRect(ctx, 255, 265, 445, 540, 34);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.stroke();

    // Top Rim Ellipse
    ctx.fillStyle = toneMeta.shade;
    ctx.beginPath();
    ctx.ellipse(477, 272, 220, 32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Printed Wrap Panel on Mug
    const px = 310;
    const py = 355;
    const pw = 335;
    const ph = 335;
    ctx.save();
    drawRoundedRect(ctx, px, py, pw, ph, 14);
    ctx.clip();
    drawImageCover(ctx, artImg, px, py, pw, ph);
    ctx.restore();

    // Cylindrical specular & edge shading across mug + artwork
    const cylGrad = ctx.createLinearGradient(255, 0, 700, 0);
    cylGrad.addColorStop(0, 'rgba(0,0,0,0.16)');
    cylGrad.addColorStop(0.28, 'rgba(255,255,255,0.14)');
    cylGrad.addColorStop(0.65, 'rgba(0,0,0,0)');
    cylGrad.addColorStop(1, 'rgba(0,0,0,0.2)');
    ctx.fillStyle = cylGrad;
    drawRoundedRect(ctx, 255, 265, 445, 540, 34);
    ctx.fill();
    ctx.restore();
  } else if (params.productType === 'poster') {
    // Framed Museum Archival Poster
    ctx.save();
    ctx.shadowColor = 'rgba(28, 25, 23, 0.22)';
    ctx.shadowBlur = 32;
    ctx.shadowOffsetY = 16;

    // Outer wooden frame
    ctx.fillStyle = '#292524';
    drawRoundedRect(ctx, 200, 105, 600, 780, 6);
    ctx.fill();
    ctx.shadowColor = 'transparent';

    // Archival matboard
    ctx.fillStyle = '#FBF9F5';
    ctx.fillRect(228, 133, 544, 724);

    // Artwork print window
    const px = 288;
    const py = 193;
    const pw = 424;
    const ph = 520;
    ctx.save();
    ctx.beginPath();
    ctx.rect(px, py, pw, ph);
    ctx.clip();
    drawImageCover(ctx, artImg, px, py, pw, ph);
    ctx.restore();

    ctx.strokeStyle = '#D6CEBE';
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, pw, ph);

    // Museum plaque caption inside mat
    ctx.fillStyle = '#1C1917';
    ctx.font = '600 22px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(params.motifTitle.slice(0, 42), W / 2, 764);

    ctx.fillStyle = '#57534E';
    ctx.font = '15px sans-serif';
    ctx.fillText(`${params.artStyle} · Original Artist: ${params.artistName}`, W / 2, 796);
    ctx.restore();
  } else if (params.productType === 'phone_case') {
    // Matte Phone Case Silhouette
    ctx.save();
    ctx.shadowColor = 'rgba(28, 25, 23, 0.22)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 16;

    const cx = 315;
    const cy = 120;
    const cw = 370;
    const ch = 755;

    ctx.fillStyle = toneMeta.fill;
    ctx.strokeStyle = '#1C1917';
    ctx.lineWidth = 8;
    drawRoundedRect(ctx, cx, cy, cw, ch, 54);
    ctx.fill();
    ctx.shadowColor = 'transparent';

    // Clip artwork inside phone shell
    ctx.save();
    drawRoundedRect(ctx, cx + 6, cy + 6, cw - 12, ch - 12, 48);
    ctx.clip();
    drawImageCover(ctx, artImg, cx + 6, cy + 6, cw - 12, ch - 12);

    // Subtle matte edge highlight
    const rimGrad = ctx.createLinearGradient(cx, cy, cx + cw, cy);
    rimGrad.addColorStop(0, 'rgba(255,255,255,0.16)');
    rimGrad.addColorStop(0.12, 'rgba(255,255,255,0)');
    rimGrad.addColorStop(0.88, 'rgba(0,0,0,0)');
    rimGrad.addColorStop(1, 'rgba(0,0,0,0.18)');
    ctx.fillStyle = rimGrad;
    ctx.fillRect(cx, cy, cw, ch);
    ctx.restore();

    // Outer frame stroke
    ctx.strokeStyle = '#1C1917';
    ctx.lineWidth = 8;
    drawRoundedRect(ctx, cx, cy, cw, ch, 54);
    ctx.stroke();

    // Camera Island
    ctx.fillStyle = '#1C1917';
    drawRoundedRect(ctx, cx + 28, cy + 28, 128, 132, 26);
    ctx.fill();

    // Camera lenses
    const lenses = [
      [cx + 62, cy + 64],
      [cx + 62, cy + 122],
      [cx + 118, cy + 93],
    ];
    for (const [lx, ly] of lenses) {
      ctx.fillStyle = '#0A0A0A';
      ctx.beginPath();
      ctx.arc(lx, ly, 21, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#57534E';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();
  }

  // ============================================================================
  // IMMUTABLE BAKED-IN ATTRIBUTION BAND (Cannot be stripped or hidden)
  // ============================================================================
  ctx.fillStyle = '#1C1917';
  ctx.fillRect(0, STAGE_H, W, FOOTER_H);

  ctx.fillStyle = '#9A3412';
  ctx.fillRect(0, STAGE_H, W, 4);

  const creditText = formatMockupCredit({
    artistName: params.artistName,
    artStyle: params.artStyle,
    remixId: params.remixId,
  });

  ctx.fillStyle = '#FBF9F5';
  ctx.font = '600 22px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(creditText, W / 2, STAGE_H + 46, W - 80);

  ctx.fillStyle = '#A8A29E';
  ctx.font = '500 13px sans-serif';
  ctx.fillText(
    'FOLK ART REMIX WITH CREDIT  ·  PERMANENT PROVENANCE ATTRIBUTION',
    W / 2,
    STAGE_H + 84,
    W - 80,
  );

  return canvas.toDataURL('image/png');
}
