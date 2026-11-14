import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function parseDataUrl(input: string, fallbackMime = 'image/jpeg'): { mimeType: string; data: string } {
  const match = input.match(/^data:([^;]+);base64,(.+)$/);
  if (match) {
    return { mimeType: match[1], data: match[2] };
  }
  return { mimeType: fallbackMime, data: input };
}

function extractGeminiErrorDetails(error: unknown): { status: number; message: string } {
  const rawMessage = error instanceof Error ? error.message : String(error);
  const lower = rawMessage.toLowerCase();

  if (lower.includes('429') || lower.includes('resource_exhausted') || lower.includes('quota')) {
    return {
      status: 429,
      message:
        'Gemini image generation quota exceeded or requires a billing-enabled API key. Check Settings > Secrets to use a paid-tier GEMINI_API_KEY.',
    };
  }
  if (lower.includes('403') || lower.includes('permission_denied') || lower.includes('api_key_invalid')) {
    return {
      status: 403,
      message:
        'Gemini API access denied for this key. Please verify your GEMINI_API_KEY in Settings > Secrets.',
    };
  }
  return {
    status: 500,
    message: rawMessage || 'Gemini request failed.',
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '20mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.post('/api/gemini/analyze-motif', async (req, res) => {
    try {
      const { imageBase64, mimeType, title, artStyle, region, story } = req.body ?? {};
      if (!imageBase64 || typeof imageBase64 !== 'string') {
        res.status(400).json({ error: 'An uploaded motif image is required for analysis.' });
        return;
      }

      const parsed = parseDataUrl(imageBase64, typeof mimeType === 'string' ? mimeType : 'image/jpeg');
      const ai = getGeminiClient();

      const prompt = [
        'You are a Bengali & South Asian folk-art archivist and museum curator based in Kolkata.',
        'Inspect the uploaded folk art motif image carefully alongside any optional metadata provided by the artisan.',
        `Optional artisan context — Title: "${title || 'Untitled'}", Selected Style: "${artStyle || 'Unspecified'}", Region: "${region || 'Unspecified'}", Story: "${story || 'None provided'}".`,
        'Return accurate archival metadata in JSON:',
        '1. motifDescription: 2-3 clear sentences describing the visual composition, brushwork or stitchwork, and central iconography visible in the image.',
        '2. detectedStyle: Identify the closest traditional folk style (e.g., "Patachitra", "Alpona", "Kantha", "Kalighat", "Dokra", "Madhubani", or another concise traditional style name).',
        '3. dominantColors: List 3 to 5 dominant pigment or thread colors actually visible in the artwork, each with a poetic craft pigment name (e.g., "Vermilion Ochre", "Chalk Rice Paste", "Indigo Wash") and a valid 6-digit hex code.',
        '4. culturalNote: Write a respectful, concise 2-line cultural note (separated by a newline or two short crisp sentences, under 45 words total) explaining the heritage, ritual or storytelling context, and why attribution matters for this tradition.',
      ].join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: parsed.mimeType,
                data: parsed.data,
              },
            },
            { text: prompt },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              motifDescription: {
                type: Type.STRING,
                description: '2-3 sentence visual description of the motif.',
              },
              detectedStyle: {
                type: Type.STRING,
                description: 'Detected traditional folk art style.',
              },
              dominantColors: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    hex: { type: Type.STRING },
                  },
                },
                description: '3 to 5 dominant pigment/thread colors with hex codes.',
              },
              culturalNote: {
                type: Type.STRING,
                description: 'Concise 2-line cultural note respecting the folk tradition.',
              },
            },
          },
        },
      });

      const rawText = (response.text ?? '{}').trim();
      const result = JSON.parse(rawText);

      res.json({
        motifDescription: typeof result.motifDescription === 'string' ? result.motifDescription : '',
        detectedStyle: typeof result.detectedStyle === 'string' ? result.detectedStyle : artStyle || 'Patachitra',
        dominantColors: Array.isArray(result.dominantColors) ? result.dominantColors.slice(0, 5) : [],
        culturalNote: typeof result.culturalNote === 'string' ? result.culturalNote : '',
      });
    } catch (error) {
      const details = extractGeminiErrorDetails(error);
      res.status(details.status).json({ error: details.message });
    }
  });

  app.post('/api/gemini/generate-remix', async (req, res) => {
    try {
      const {
        primaryImageBase64,
        secondaryImageBase64,
        license,
        secondaryLicense,
        prompts,
        resolution,
        variationType,
        customPrompt,
        artStyle,
        title,
        artistName,
      } = req.body ?? {};

      if (license === 'not_allowed' || secondaryLicense === 'not_allowed') {
        res.status(403).json({
          error:
            'Ethical License Guardrail: Remix generation is blocked because the artist set the license to "not_allowed".',
        });
        return;
      }

      if (!primaryImageBase64 || typeof primaryImageBase64 !== 'string') {
        res.status(400).json({ error: 'Primary motif image data is required.' });
        return;
      }

      if (!Array.isArray(prompts) || prompts.length === 0) {
        res.status(400).json({ error: 'At least one variation prompt is required.' });
        return;
      }

      const validResolution =
        resolution === '2K' || resolution === '4K' ? resolution : '1K';
      const primaryPart = parseDataUrl(primaryImageBase64);
      const secondaryPart =
        typeof secondaryImageBase64 === 'string' && secondaryImageBase64.length > 0
          ? parseDataUrl(secondaryImageBase64)
          : null;

      const ai = getGeminiClient();
      const targetPrompts = prompts.slice(0, 4);

      const variationRequests = targetPrompts.map(async (entry: unknown, idx: number) => {
        const promptText =
          typeof entry === 'object' && entry !== null && 'prompt' in entry
            ? String((entry as { prompt: unknown }).prompt)
            : String(entry);
        const angleLabel =
          typeof entry === 'object' && entry !== null && 'angleLabel' in entry
            ? String((entry as { angleLabel: unknown }).angleLabel)
            : `Variation ${idx + 1}`;

        const parts: Array<
          | { inlineData: { mimeType: string; data: string } }
          | { text: string }
        > = [
          {
            inlineData: {
              mimeType: primaryPart.mimeType,
              data: primaryPart.data,
            },
          },
        ];

        if (secondaryPart) {
          parts.push({
            inlineData: {
              mimeType: secondaryPart.mimeType,
              data: secondaryPart.data,
            },
          });
        }

        parts.push({ text: promptText });

        const response = await ai.models.generateContent({
          model: 'gemini-nano-banana-2.1',
          contents: { parts },
          config: {
            imageConfig: {
              aspectRatio: '1:1',
              imageSize: validResolution,
            },
          },
        });

        let generatedDataUrl = '';
        for (const part of response.candidates?.[0]?.content?.parts ?? []) {
          if (part.inlineData?.data) {
            const mime = part.inlineData.mimeType ?? 'image/png';
            generatedDataUrl = `data:${mime};base64,${part.inlineData.data}`;
            break;
          }
        }

        if (!generatedDataUrl) {
          throw new Error(`Variation ${idx + 1} did not return an image from Gemini.`);
        }

        return {
          id: `var_${Date.now()}_${idx + 1}`,
          angleLabel,
          promptUsed: promptText,
          imageDataUrl: generatedDataUrl,
        };
      });

      const settled = await Promise.allSettled(variationRequests);
      const variations = settled
        .filter(
          (
            r,
          ): r is PromiseFulfilledResult<{
            id: string;
            angleLabel: string;
            promptUsed: string;
            imageDataUrl: string;
          }> => r.status === 'fulfilled',
        )
        .map((r) => r.value);

      const failures = settled.filter(
        (r): r is PromiseRejectedResult => r.status === 'rejected',
      );

      if (variations.length > 0) {
        res.json({
          mode: 'gemini_image',
          variations,
          warning:
            failures.length > 0
              ? `${failures.length} variation(s) could not be generated; showing ${variations.length} completed variations.`
              : undefined,
        });
        return;
      }

      // Automatic Free-Tier Hybrid Fallback using gemini-4-hydrogen
      const firstReason = failures[0]?.reason;
      const errDetails = extractGeminiErrorDetails(firstReason);
      const rawErrMsg =
        firstReason instanceof Error ? firstReason.message.toLowerCase() : String(firstReason).toLowerCase();
      const isQuotaOrBillingOrModelIssue =
        errDetails.status === 429 ||
        errDetails.status === 403 ||
        rawErrMsg.includes('billing') ||
        rawErrMsg.includes('paid') ||
        rawErrMsg.includes('not_found') ||
        rawErrMsg.includes('404') ||
        rawErrMsg.includes('400');

      if (!isQuotaOrBillingOrModelIssue) {
        res.status(errDetails.status).json({ error: errDetails.message });
        return;
      }

      const desiredCount = targetPrompts.length;
      const fallbackParts: Array<
        | { inlineData: { mimeType: string; data: string } }
        | { text: string }
      > = [
        {
          inlineData: {
            mimeType: primaryPart.mimeType,
            data: primaryPart.data,
          },
        },
      ];
      if (secondaryPart) {
        fallbackParts.push({
          inlineData: {
            mimeType: secondaryPart.mimeType,
            data: secondaryPart.data,
          },
        });
      }

      const hybridPrompt = [
        `You are a Kolkata folk-art creative director helping design ${desiredCount} distinct visual remix specifications for "${title || 'Folk Motif'}" (${artStyle || 'Patachitra'} by ${artistName || 'Artisan'}).`,
        `Selected variation mode: "${variationType || 'color_palette'}".`,
        `User creative direction: "${customPrompt || 'Respect traditional heritage pigments and craft clarity'}".`,
        `Generate exactly ${desiredCount} distinct, culturally authentic color & composition specifications in JSON so a high-DPI Canvas renderer can apply them to the uploaded artwork:`,
        '- Choose rich, harmonious 6-digit hex codes for backgroundHex, primaryHex, secondaryHex, accentHex, and inkHex.',
        '- Choose the most fitting treatment.mode from: "pigment_remap", "tile_grid", "border_frieze", "woodblock_poster", "dual_blend", "mood_wash".',
        '- For "pattern_tiling", vary tileCols (2 or 3) and alternate "tile_grid" and "border_frieze".',
        '- For "simplified_modern", use "woodblock_poster" with high contrast (1.2-1.4).',
        '- For "mix_second_motif", use "dual_blend" with blendOpacity between 0.25 and 0.5.',
        '- Choose frameStyle from: "none", "patachitra_border", "alpona_corners", "kantha_stitch".',
      ].join('\n');

      fallbackParts.push({ text: hybridPrompt });

      const hybridResponse = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: { parts: fallbackParts },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              specs: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    angleLabel: { type: Type.STRING },
                    palette: {
                      type: Type.OBJECT,
                      properties: {
                        backgroundHex: { type: Type.STRING },
                        primaryHex: { type: Type.STRING },
                        secondaryHex: { type: Type.STRING },
                        accentHex: { type: Type.STRING },
                        inkHex: { type: Type.STRING },
                      },
                    },
                    treatment: {
                      type: Type.OBJECT,
                      properties: {
                        mode: { type: Type.STRING },
                        tileCols: { type: Type.INTEGER },
                        frameStyle: { type: Type.STRING },
                        contrast: { type: Type.NUMBER },
                        saturation: { type: Type.NUMBER },
                        blendOpacity: { type: Type.NUMBER },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      const parsedHybrid = JSON.parse((hybridResponse.text ?? '{}').trim());
      const rawSpecs = Array.isArray(parsedHybrid.specs) ? parsedHybrid.specs : [];

      const specs = targetPrompts.map((entry: unknown, idx: number) => {
        const promptText =
          typeof entry === 'object' && entry !== null && 'prompt' in entry
            ? String((entry as { prompt: unknown }).prompt)
            : String(entry);
        const fallbackAngle =
          typeof entry === 'object' && entry !== null && 'angleLabel' in entry
            ? String((entry as { angleLabel: unknown }).angleLabel)
            : `Variation ${idx + 1}`;
        const item = rawSpecs[idx] ?? rawSpecs[0] ?? {};
        return {
          id: `var_${Date.now()}_${idx + 1}`,
          title: typeof item.title === 'string' ? item.title : `Variation ${idx + 1}`,
          angleLabel:
            typeof item.angleLabel === 'string' && item.angleLabel.trim()
              ? `${item.title ? `${item.title}: ` : ''}${item.angleLabel}`
              : fallbackAngle,
          promptUsed: promptText,
          palette: {
            backgroundHex: item.palette?.backgroundHex || '#F5EFE2',
            primaryHex: item.palette?.primaryHex || '#9A3412',
            secondaryHex: item.palette?.secondaryHex || '#D4922A',
            accentHex: item.palette?.accentHex || '#1E3A5F',
            inkHex: item.palette?.inkHex || '#1C1917',
          },
          treatment: {
            mode: item.treatment?.mode || 'pigment_remap',
            tileCols: Number(item.treatment?.tileCols) || 2,
            frameStyle: item.treatment?.frameStyle || 'patachitra_border',
            contrast: Number(item.treatment?.contrast) || 1.15,
            saturation: Number(item.treatment?.saturation) || 0.9,
            blendOpacity: Number(item.treatment?.blendOpacity) || 0.32,
          },
        };
      });

      res.json({
        mode: 'gemini_hybrid_canvas',
        fallbackInfo:
          'Free-Tier Hybrid Mode active: Gemini 4 Hydrogen directed these pigment and layout variations, rendered locally on high-DPI Canvas.',
        specs,
      });
    } catch (error) {
      const details = extractGeminiErrorDetails(error);
      res.status(details.status).json({ error: details.message });
    }
  });

  app.post('/api/gemini/product-caption', async (req, res) => {
    try {
      const { artistName, artStyle, region, motifTitle, productType, creditLine } = req.body ?? {};
      const ai = getGeminiClient();

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: [
          `Write a concise 2-sentence ethical product catalog description for a "${String(productType || 'craft').replace(/_/g, ' ')}" featuring an adaptation of "${motifTitle || 'Folk Motif'}" (${artStyle || 'Folk Art'} from ${region || 'West Bengal'}).`,
          `It must naturally honor original artist ${artistName || 'the artisan'} and preserve the attribution "${creditLine || ''}". Keep it warm, authentic, and under 45 words.`,
        ].join('\n'),
      });

      res.json({ caption: (response.text ?? '').trim() });
    } catch (error) {
      const details = extractGeminiErrorDetails(error);
      res.status(details.status).json({ error: details.message });
    }
  });

  app.post('/api/gemini/chat', async (req, res) => {
    try {
      const { history, message, activeMotifContext } = req.body ?? {};
      if (!message || typeof message !== 'string') {
        res.status(400).json({ error: 'Message text is required.' });
        return;
      }

      const ai = getGeminiClient();
      const contextSnippet = activeMotifContext
        ? `\nCurrently viewed motif context: Title "${activeMotifContext.title}", Style "${activeMotifContext.artStyle}", Region "${activeMotifContext.region}", Artist "${activeMotifContext.artistName}", License "${activeMotifContext.license}", Story: "${activeMotifContext.story}".`
        : '';

      const chat = ai.chats.create({
        model: 'gemini-4-hydrogen',
        config: {
          systemInstruction:
            'You are a knowledgeable Bengali folk-art curator and ethical design advisor for the Kolkata "Folk Art Remix with Credit" archive. Help artisans document their motifs (Patachitra, Alpona, Nakshi Kantha, Kalighat, Dokra) and guide designers toward respectful, properly credited adaptations that never erase living artists or violate "Not Allowed" licenses. Keep answers concise, warm, and grounded in craft history.' +
            contextSnippet,
        },
        history: Array.isArray(history)
          ? history
              .filter(
                (item): item is { role: 'user' | 'model'; text: string } =>
                  item && (item.role === 'user' || item.role === 'model') && typeof item.text === 'string',
              )
              .map((item) => ({
                role: item.role,
                parts: [{ text: item.text }],
              }))
          : [],
      });

      const response = await chat.sendMessage({ message });
      res.json({ reply: response.text ?? '' });
    } catch (error) {
      const details = extractGeminiErrorDetails(error);
      res.status(details.status).json({ error: details.message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Folk Art Remix server listening on http://localhost:${PORT}`);
  });
}

startServer();
