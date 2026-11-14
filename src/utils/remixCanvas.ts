import type { VariationType } from '../types';

export interface HybridVariationSpec {
  id: string;
  title: string;
  angleLabel: string;
  promptUsed: string;
  palette: {
    backgroundHex: string;
    primaryHex: string;
    secondaryHex: string;
    accentHex: string;
    inkHex: string;
  };
  treatment: {
    mode:
      | 'pigment_remap'
      | 'tile_grid'
      | 'border_frieze'
      | 'woodblock_poster'
      | 'dual_blend'
      | 'mood_wash';
    tileCols: number;
    frameStyle: 'none' | 'patachitra_border' | 'alpona_corners' | 'kantha_stitch';
    contrast: number;
    saturation: number;
    blendOpacity: number;
  };
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load motif image for Canvas remix.'));
    img.src = src;
  });
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) {
    return [154, 52, 18];
  }
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function lerpColor(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  const k = Math.max(0, Math.min(1, t));
  return [
    Math.round(a[0] + (b[0] - a[0]) * k),
    Math.round(a[1] + (b[1] - a[1]) * k),
    Math.round(a[2] + (b[2] - a[2]) * k),
  ];
}

function applyPigmentRamp(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  palette: HybridVariationSpec['palette'],
  posterizeLevels: number,
  contrast: number,
  saturation: number,
) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  const ink = hexToRgb(palette.inkHex);
  const primary = hexToRgb(palette.primaryHex);
  const secondary = hexToRgb(palette.secondaryHex);
  const bg = hexToRgb(palette.backgroundHex);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    let lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    lum = Math.max(0, Math.min(1, (lum - 0.5) * contrast + 0.5));

    if (posterizeLevels > 1) {
      lum = Math.round(lum * posterizeLevels) / posterizeLevels;
    }

    let mapped: [number, number, number];
    if (lum < 0.28) {
      mapped = lerpColor(ink, primary, lum / 0.28);
    } else if (lum < 0.65) {
      mapped = lerpColor(primary, secondary, (lum - 0.28) / 0.37);
    } else {
      mapped = lerpColor(secondary, bg, (lum - 0.65) / 0.35);
    }

    // Blend back with original hue/saturation when saturation > 0.7
    const mixRatio = Math.max(0.35, Math.min(0.95, 1 - saturation * 0.25));
    data[i] = Math.round(r * (1 - mixRatio) + mapped[0] * mixRatio);
    data[i + 1] = Math.round(g * (1 - mixRatio) + mapped[1] * mixRatio);
    data[i + 2] = Math.round(b * (1 - mixRatio) + mapped[2] * mixRatio);
  }

  ctx.putImageData(imgData, 0, 0);
}

function drawCraftFrame(
  ctx: CanvasRenderingContext2D,
  size: number,
  frameStyle: HybridVariationSpec['treatment']['frameStyle'],
  palette: HybridVariationSpec['palette'],
) {
  if (frameStyle === 'none') return;

  const pad = Math.round(size * 0.045);
  ctx.save();
  ctx.strokeStyle = palette.accentHex;
  ctx.lineWidth = Math.max(3, Math.round(size * 0.008));

  if (frameStyle === 'patachitra_border') {
    ctx.strokeRect(pad, pad, size - pad * 2, size - pad * 2);
    ctx.strokeStyle = palette.inkHex;
    ctx.lineWidth = Math.max(2, Math.round(size * 0.004));
    ctx.strokeRect(pad * 1.45, pad * 1.45, size - pad * 2.9, size - pad * 2.9);
  } else if (frameStyle === 'kantha_stitch') {
    ctx.setLineDash([Math.round(size * 0.018), Math.round(size * 0.012)]);
    ctx.strokeRect(pad, pad, size - pad * 2, size - pad * 2);
    ctx.strokeStyle = palette.primaryHex;
    ctx.strokeRect(pad * 1.5, pad * 1.5, size - pad * 3, size - pad * 3);
    ctx.setLineDash([]);
  } else if (frameStyle === 'alpona_corners') {
    const r = Math.round(size * 0.085);
    const corners = [
      [pad, pad, 0],
      [size - pad, pad, Math.PI / 2],
      [size - pad, size - pad, Math.PI],
      [pad, size - pad, -Math.PI / 2],
    ];
    for (const [cx, cy, rot] of corners) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI / 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.6, 0, Math.PI / 2);
      ctx.stroke();
      ctx.restore();
    }
  }
  ctx.restore();
}

export async function renderHybridVariationToDataUrl(params: {
  primaryImageSrc: string;
  secondaryImageSrc?: string | null;
  variationType: VariationType;
  resolution: '1K' | '2K' | '4K';
  spec: HybridVariationSpec;
}): Promise<string> {
  const targetSize =
    params.resolution === '4K' ? 1600 : params.resolution === '2K' ? 1280 : 960;

  const canvas = document.createElement('canvas');
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context is unavailable.');
  }

  const primaryImg = await loadImg(params.primaryImageSrc);
  const secondaryImg = params.secondaryImageSrc
    ? await loadImg(params.secondaryImageSrc)
    : null;

  const { palette, treatment } = params.spec;

  // Base background fill
  ctx.fillStyle = palette.backgroundHex;
  ctx.fillRect(0, 0, targetSize, targetSize);

  if (treatment.mode === 'tile_grid' || params.variationType === 'pattern_tiling') {
    const cols = Math.max(2, Math.min(4, treatment.tileCols || 2));
    const tileSize = targetSize / cols;

    for (let row = 0; row < cols; row++) {
      for (let col = 0; col < cols; col++) {
        ctx.save();
        const x = col * tileSize;
        const y = row * tileSize;
        ctx.translate(x + tileSize / 2, y + tileSize / 2);
        // Subtle alternating flip for organic hand-block print rhythm
        if ((row + col) % 2 === 1) {
          ctx.scale(-1, 1);
        }
        ctx.drawImage(primaryImg, -tileSize / 2, -tileSize / 2, tileSize, tileSize);
        ctx.restore();
      }
    }
  } else if (treatment.mode === 'border_frieze') {
    const bandH = Math.round(targetSize * 0.36);
    const bandY = Math.round((targetSize - bandH) / 2);
    const cols = 3;
    const tileW = targetSize / cols;
    for (let i = 0; i < cols; i++) {
      ctx.drawImage(primaryImg, i * tileW, bandY, tileW, bandH);
    }
    ctx.fillStyle = palette.accentHex;
    ctx.fillRect(0, bandY - 12, targetSize, 8);
    ctx.fillRect(0, bandY + bandH + 4, targetSize, 8);
  } else if (
    (treatment.mode === 'dual_blend' || params.variationType === 'mix_second_motif') &&
    secondaryImg
  ) {
    // Draw secondary motif as textured outer frame / ground
    ctx.save();
    ctx.drawImage(secondaryImg, 0, 0, targetSize, targetSize);
    ctx.fillStyle = palette.backgroundHex;
    ctx.globalAlpha = 0.28;
    ctx.fillRect(0, 0, targetSize, targetSize);
    ctx.restore();

    // Draw primary motif centered inside a circular/framed medallion
    const inset = Math.round(targetSize * 0.14);
    const innerSize = targetSize - inset * 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(targetSize / 2, targetSize / 2, innerSize / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(primaryImg, inset, inset, innerSize, innerSize);
    ctx.restore();

    // Soft rhythmic overlay of secondary motif
    ctx.save();
    ctx.globalAlpha = Math.max(0.18, Math.min(0.45, treatment.blendOpacity || 0.28));
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(secondaryImg, 0, 0, targetSize, targetSize);
    ctx.restore();

    // Medallion ring
    ctx.save();
    ctx.strokeStyle = palette.accentHex;
    ctx.lineWidth = Math.max(5, Math.round(targetSize * 0.01));
    ctx.beginPath();
    ctx.arc(targetSize / 2, targetSize / 2, innerSize / 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  } else if (
    treatment.mode === 'woodblock_poster' ||
    params.variationType === 'simplified_modern'
  ) {
    const pad = Math.round(targetSize * 0.09);
    ctx.drawImage(primaryImg, pad, pad, targetSize - pad * 2, targetSize - pad * 2);
  } else {
    ctx.drawImage(primaryImg, 0, 0, targetSize, targetSize);
  }

  // Apply Gemini-curated folk pigment & contrast transformation
  const posterize =
    treatment.mode === 'woodblock_poster' || params.variationType === 'simplified_modern'
      ? 3
      : 0;

  applyPigmentRamp(
    ctx,
    targetSize,
    targetSize,
    palette,
    posterize,
    treatment.contrast || 1.12,
    treatment.saturation ?? 0.9,
  );

  // Re-apply subtle border/corner craft frame on top of remapped canvas
  drawCraftFrame(ctx, targetSize, treatment.frameStyle, palette);

  return canvas.toDataURL('image/jpeg', 0.9);
}
