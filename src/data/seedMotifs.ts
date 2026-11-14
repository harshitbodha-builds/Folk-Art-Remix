import patachitraImg from '../assets/images/motif_patachitra_fish_1794653576503.jpg';
import alponaImg from '../assets/images/motif_alpona_lotus_1794653577728.jpg';
import kanthaImg from '../assets/images/motif_nakshi_kantha_1794653577170.jpg';
import kalighatImg from '../assets/images/motif_kalighat_peacock_1794653577379.jpg';
import bonbibiImg from '../assets/images/motif_bonbibi_tiger_1794654686759.jpg';
import dokraImg from '../assets/images/motif_dokra_horse_1794654687516.jpg';
import type { Artist, Motif } from '../types';

export const SEED_ARTISTS: Artist[] = [
  {
    id: 'art_seed_1',
    name: 'Swarna Chitrakar',
    region: 'Naya, Medinipur, West Bengal',
    primaryStyle: 'Patachitra',
    contactOrHandle: '@naya_patachitra_collective',
    upiId: 'swarna.pata@okaxis',
    createdAt: '2026-10-12T09:30:00.000Z',
  },
  {
    id: 'art_seed_2',
    name: 'Ananya Basu',
    region: 'Santiniketan, Birbhum, West Bengal',
    primaryStyle: 'Alpona',
    contactOrHandle: '@alpona_birbhum',
    upiId: 'ananya.alpona@upi',
    createdAt: '2026-10-18T11:15:00.000Z',
  },
  {
    id: 'art_seed_3',
    name: 'Rehana Begum',
    region: 'Nanoor, Birbhum, West Bengal',
    primaryStyle: 'Kantha',
    contactOrHandle: '@nanoor_kantha_guild',
    upiId: 'rehana.kantha@okicici',
    createdAt: '2026-10-24T14:20:00.000Z',
  },
  {
    id: 'art_seed_4',
    name: 'Debashis Paul',
    region: 'Kalighat, Kolkata, West Bengal',
    primaryStyle: 'Kalighat',
    contactOrHandle: '@kalighat_studio',
    createdAt: '2026-11-02T08:45:00.000Z',
  },
  {
    id: 'art_seed_5',
    name: 'Anwar Chitrakar',
    region: 'Pingla, Paschim Medinipur, West Bengal',
    primaryStyle: 'Patachitra',
    contactOrHandle: '@pingla_patua_guild',
    upiId: 'anwar.patachitra@okaxis',
    createdAt: '2026-11-05T10:15:00.000Z',
  },
  {
    id: 'art_seed_6',
    name: 'Gopal Karmakar',
    region: 'Bikna, Bankura, West Bengal',
    primaryStyle: 'Dokra',
    contactOrHandle: '@bikna_dokra_craft',
    upiId: 'gopal.dokra@upi',
    createdAt: '2026-11-08T16:10:00.000Z',
  },
];

export const SEED_MOTIFS: Motif[] = [
  {
    id: 'mot_seed_1',
    artistId: 'art_seed_1',
    artistName: 'Swarna Chitrakar',
    contactOrHandle: '@naya_patachitra_collective',
    upiId: 'swarna.pata@okaxis',
    title: 'Auspicious Matsya & Lotus Scroll',
    artStyle: 'Patachitra',
    region: 'Naya, Medinipur, West Bengal',
    imageDataUrl: patachitraImg,
    story:
      'Painted with earth pigments and bel-gum binder for monsoon storytelling scrolls, the fish surrounded by blooming lotuses symbolizes riverine abundance and safe passage for Bengal fisherfolk.',
    motifDescription:
      'A central stylized carp framed inside a circular medallion of multi-layered lotus blossoms and scrolling floral creepers, outlined in crisp lampblack brushwork against natural paper.',
    detectedStyle: 'Patachitra',
    dominantColors: [
      { name: 'Vermilion Earth', hex: '#B93822' },
      { name: 'Turmeric Ochre', hex: '#D4922A' },
      { name: 'Indigo Wash', hex: '#34587A' },
      { name: 'Aged Cotton Paper', hex: '#EDE2CB' },
    ],
    culturalNote:
      'Rooted in Naya village Patua scroll-singing traditions using hand-ground mineral pigments.\nRetain the lotus medallion and crisp outline rhythm when adapting so the auspicious intent endures.',
    license: 'remix_with_credit',
    consentConfirmed: true,
    isDemo: true,
    createdAt: '2026-10-12T09:30:00.000Z',
  },
  {
    id: 'mot_seed_2',
    artistId: 'art_seed_2',
    artistName: 'Ananya Basu',
    contactOrHandle: '@alpona_birbhum',
    upiId: 'ananya.alpona@upi',
    title: 'Sharad Lotus & Paddy Alpona',
    artStyle: 'Alpona',
    region: 'Santiniketan, Birbhum, West Bengal',
    imageDataUrl: alponaImg,
    story:
      'Drawn freehand with soaked rice paste (pithali) on red clay courtyards during harvest and Poush festivals, weaving conch spirals, paddy sheaves, and an eight-petalled lotus.',
    motifDescription:
      'Radial white rice-paste mandala centered on an open lotus rosette, surrounded by four directional conch spirals and corner paddy-stalk clusters on deep terracotta earth.',
    detectedStyle: 'Alpona',
    dominantColors: [
      { name: 'Rice Paste Chalk', hex: '#F3EFE6' },
      { name: 'Laterite Clay', hex: '#7D4725' },
      { name: 'Burnt Earth', hex: '#5A3219' },
    ],
    culturalNote:
      'Born in women-led courtyard rituals of Bengal and elevated at Kala Bhavana in Santiniketan.\nRespect the continuous rice-paste line weight and sacred harvest symmetry in derivative layouts.',
    license: 'remix_allowed',
    consentConfirmed: true,
    isDemo: true,
    createdAt: '2026-10-18T11:15:00.000Z',
  },
  {
    id: 'mot_seed_3',
    artistId: 'art_seed_3',
    artistName: 'Rehana Begum',
    contactOrHandle: '@nanoor_kantha_guild',
    upiId: 'rehana.kantha@okicici',
    title: 'Jibanbriksha Nakshi Kantha',
    artStyle: 'Kantha',
    region: 'Nanoor, Birbhum, West Bengal',
    imageDataUrl: kanthaImg,
    story:
      'Hand-stitched over three months from reclaimed cotton saris using fine running stitches, depicting the Tree of Life sheltered by folk birds and diamond border ripples.',
    motifDescription:
      'Intricate needlework composition featuring a central spiral-trunked tree populated by peacocks and parakeets, framed by concentric ripple stitches and geometric diamond borders.',
    detectedStyle: 'Kantha',
    dominantColors: [
      { name: 'Madder Crimson', hex: '#8F242B' },
      { name: 'Indigo Thread', hex: '#273B59' },
      { name: 'Mustard Tussar', hex: '#B58938' },
      { name: 'Unbleached Cotton', hex: '#EDE5D3' },
    ],
    culturalNote:
      'Nakshi Kantha transforms worn household cloth into heirloom memory through slow collective stitching.\nCredit Nanoor women artisans whenever translating stitch ripples into printed textiles.',
    license: 'remix_with_credit',
    consentConfirmed: true,
    isDemo: true,
    createdAt: '2026-10-24T14:20:00.000Z',
  },
  {
    id: 'mot_seed_4',
    artistId: 'art_seed_4',
    artistName: 'Debashis Paul',
    contactOrHandle: '@kalighat_studio',
    title: 'Kalighat Calligraphic Peacock',
    artStyle: 'Kalighat',
    region: 'Kalighat, Kolkata, West Bengal',
    imageDataUrl: kalighatImg,
    story:
      'An original archival commission honoring 19th-century Kolkata bazaar painters, using bold sweeping ink contours and translucent mineral washes. Archived for reference only.',
    motifDescription:
      'Dynamic full-plumage dancing peacock rendered in sweeping black calligraphic brush strokes with deep Prussian blue and verdigris green watercolor washes flanked by two figures.',
    detectedStyle: 'Kalighat',
    dominantColors: [
      { name: 'Lampblack Ink', hex: '#1F1D1B' },
      { name: 'Lapis Indigo', hex: '#234766' },
      { name: 'Verdigris Wash', hex: '#4F775E' },
      { name: 'Ivory Handmade Rag', hex: '#EFE7D4' },
    ],
    culturalNote:
      'Kalighat patuas pioneered bold volumetric shading and urban visual satire in 19th-century Kolkata.\nThis work is archived under a protected license and may not be remixed without direct commission.',
    license: 'not_allowed',
    consentConfirmed: true,
    isDemo: true,
    createdAt: '2026-11-02T08:45:00.000Z',
  },
  {
    id: 'mot_seed_5',
    artistId: 'art_seed_5',
    artistName: 'Anwar Chitrakar',
    contactOrHandle: '@pingla_patua_guild',
    upiId: 'anwar.patachitra@okaxis',
    title: 'Bonbibi & Sundarbans Tiger Scroll',
    artStyle: 'Patachitra',
    region: 'Pingla, Paschim Medinipur, West Bengal',
    imageDataUrl: bonbibiImg,
    story:
      'Sung during mangrove forest honey-gathering journeys, this Patachitra celebrates ecological coexistence between Sundarbans villagers, the forest guardian Bonbibi, and Dakshin Rai.',
    motifDescription:
      'A striped folk tiger striding through stylized mangrove foliage above river ripples and birds, enclosed in a double floral scroll frame with terracotta and indigo mineral fills.',
    detectedStyle: 'Patachitra',
    dominantColors: [
      { name: 'Sundarbans Terracotta', hex: '#B44425' },
      { name: 'Mangrove Indigo', hex: '#233D57' },
      { name: 'Turmeric Gold', hex: '#D19129' },
      { name: 'Handmade Rag', hex: '#E9DFCA' },
    ],
    culturalNote:
      'Part of the oral-visual Bonbibi Pala tradition of lower Bengal honoring forest conservation.\nPreserve the floral border cadence and story attribution to Pingla Patuas when adapting.',
    license: 'remix_with_credit',
    consentConfirmed: true,
    isDemo: true,
    createdAt: '2026-11-05T10:15:00.000Z',
  },
  {
    id: 'mot_seed_6',
    artistId: 'art_seed_6',
    artistName: 'Gopal Karmakar',
    contactOrHandle: '@bikna_dokra_craft',
    upiId: 'gopal.dokra@upi',
    title: 'Bikna Spiral Dokra Horse',
    artStyle: 'Dokra',
    region: 'Bikna, Bankura, West Bengal',
    imageDataUrl: dokraImg,
    story:
      'Cast in brass via a 4,000-year-old lost-wax beeswax-thread method in Bankura, the Bankura Dokra horse embodies rural resilience, auspicious vows, and metallic spiral geometry.',
    motifDescription:
      'Profile of a ceremonial brass horse adorned with concentric coiled-wire spirals, ridged collar bands, and antique bronze patina mounted against deep indigo handloom cloth.',
    detectedStyle: 'Dokra',
    dominantColors: [
      { name: 'Antique Brass', hex: '#A57E3B' },
      { name: 'Bankura Indigo', hex: '#1F3654' },
      { name: 'Aged Bronze', hex: '#634A26' },
      { name: 'Teak Frame', hex: '#4B3A2C' },
    ],
    culturalNote:
      'Crafted by Bikna artisans using non-ferrous lost-wax casting passed down across generations.\nKeep the coiled-wire spiral ornament recognizable whenever translating into print or textile.',
    license: 'remix_allowed',
    consentConfirmed: true,
    isDemo: true,
    createdAt: '2026-11-08T16:10:00.000Z',
  },
];
