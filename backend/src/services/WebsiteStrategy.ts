import { z } from 'zod';
import type { BusinessData, SiteAsset } from './siteArtefactSchema';
import type { LeadImageCollection, ReviewEntry } from './SiteImages';

export const WEBSITE_PROMPT_VERSION = 'premium-site-v3';

const fact = z.string().max(500).default('');
export const businessAnalysisSchema = z.object({
  businessType: fact,
  positioning: fact,
  audience: fact,
  primaryGoal: fact,
  trustSignals: z.array(z.string().max(180)).max(8),
  availableFacts: z.array(z.string().max(260)).max(30),
  missingFacts: z.array(z.string().max(120)).max(20),
  contentRisks: z.array(z.string().max(220)).max(12),
  recommendedSections: z.array(z.string().max(60)).min(4).max(14),
  avoidSections: z.array(z.string().max(60)).max(12),
});
export type BusinessAnalysis = z.infer<typeof businessAnalysisSchema>;

export const creativeBriefSchema = z.object({
  concept: fact,
  mood: z.array(z.string().max(60)).min(3).max(6),
  paletteDirection: fact,
  typography: z.object({ display: fact, body: fact, rationale: fact }),
  composition: fact,
  heroStrategy: fact,
  imageDirection: fact,
  motionDirection: fact,
  conversionStrategy: fact,
  sectionPlan: z.array(z.object({ type: z.string().max(60), purpose: z.string().max(220), treatment: z.string().max(240) })).min(4).max(14),
  antiTemplateRules: z.array(z.string().max(220)).min(3).max(10),
});
export type CreativeBrief = z.infer<typeof creativeBriefSchema>;

export const assetManifestSchema = z.object({
  assets: z.array(z.object({
    token: z.string(),
    role: z.enum(['REAL_BUSINESS_PHOTO', 'OFFICIAL_SOCIAL_ASSET', 'SUPPLEMENTAL_STOCK']),
    purpose: z.string(),
    provider: z.string(),
    alt: z.string(),
    isBusinessAsset: z.boolean(),
  })).max(20),
  allowedTokens: z.array(z.string()).max(20),
  realAssetCount: z.number().int().nonnegative(),
  strategy: z.string(),
});
export type AssetManifest = z.infer<typeof assetManifestSchema>;

export interface WebsiteGenerationContext {
  business: BusinessData;
  notes: string;
  summary: string;
  reviews: ReviewEntry[];
  assets: SiteAsset[];
  socialProfiles: LeadImageCollection['profiles'];
  unavailableSocial: LeadImageCollection['unavailableSocial'];
}

const text = (value: string | undefined | null) => value?.trim() || '';
const has = (value: string | undefined | null) => Boolean(text(value));
const lower = (business: BusinessData) => `${business.category} ${business.categories.join(' ')}`.toLowerCase();

export function buildWebsiteGenerationContext(
  business: BusinessData,
  input: LeadImageCollection,
  notes?: string | null,
): WebsiteGenerationContext {
  return {
    business,
    notes: text(notes).slice(0, 1200),
    summary: text(input.summary).slice(0, 1200),
    reviews: (input.reviews ?? []).filter(review => has(review.text)).slice(0, 6),
    assets: input.assets.slice(0, 20),
    socialProfiles: input.profiles ?? {},
    unavailableSocial: input.unavailableSocial,
  };
}

export function analyzeBusinessForWebsite(context: WebsiteGenerationContext): BusinessAnalysis {
  const { business, assets, reviews } = context;
  const niche = lower(business);
  const isFood = /restaurante|pizz|bar|cafe|padaria|alimenta/.test(niche);
  const isHealth = /clinica|dent|medic|saude|estet|veterin/.test(niche);
  const isIndustrial = /marmor|constru|engenh|industri|oficina|solar|eletric|metal/.test(niche);
  const primaryGoal = business.whatsapp || business.phone
    ? (isFood ? 'Estimular contato, reserva ou pedido pelo canal real disponível.' : 'Converter interesse em contato qualificado pelo canal real disponível.')
    : 'Apresentar o negócio com clareza e orientar a visita ao endereço disponível.';
  const trustSignals: string[] = [];
  if (has(business.rating)) trustSignals.push(`Nota real ${business.rating}${has(business.reviewCount) ? ` com ${business.reviewCount} avaliações` : ''}.`);
  if (reviews.length) trustSignals.push(`${reviews.length} avaliações textuais reais disponíveis.`);
  if (has(business.address)) trustSignals.push('Endereço completo disponível.');
  if (assets.some(asset => asset.isBusinessAsset)) trustSignals.push('Fotografia real do estabelecimento disponível.');
  const facts = [
    `Nome: ${business.name}`,
    has(business.category) ? `Categoria: ${business.category}` : '',
    has(business.city) ? `Localidade: ${business.city}${business.state ? ` - ${business.state}` : ''}` : '',
    has(business.address) ? `Endereço: ${business.address}` : '',
    has(business.phone) ? `Telefone: ${business.phone}` : '',
    has(business.whatsapp) ? `WhatsApp: ${business.whatsapp}` : '',
    has(business.hours) ? `Horários: ${business.hours}` : '',
    has(context.summary) ? `Resumo verificado: ${context.summary}` : '',
  ].filter(Boolean);
  const missing = [
    !has(business.hours) ? 'horários de atendimento' : '',
    !has(business.rating) ? 'avaliação pública' : '',
    !reviews.length ? 'depoimentos textuais' : '',
    !assets.some(asset => asset.isBusinessAsset) ? 'fotografias reais do negócio' : '',
    !has(business.phone) && !has(business.whatsapp) ? 'canal de contato' : '',
  ].filter(Boolean);
  const recommended = ['Header', 'Hero'];
  if (context.summary || context.notes) recommended.push('Apresentação');
  recommended.push(isFood ? 'Experiência/Oferta' : 'Serviços/Especialidades');
  if (assets.length >= 2) recommended.push('Galeria editorial');
  if (trustSignals.length) recommended.push('Prova de confiança');
  if (has(business.address)) recommended.push('Localização');
  if (business.whatsapp || business.phone) recommended.push('CTA de contato');
  recommended.push('Footer');
  return businessAnalysisSchema.parse({
    businessType: business.category || business.categories[0] || 'Negócio local',
    positioning: isIndustrial ? 'Precisão, confiança técnica e execução profissional.' : isHealth ? 'Confiança, cuidado e clareza.' : isFood ? 'Experiência sensorial, acolhimento e desejo.' : 'Presença local confiável com comunicação direta.',
    audience: `Pessoas da região de ${business.city || 'atuação'} procurando ${business.category || 'este tipo de serviço'}.`,
    primaryGoal,
    trustSignals,
    availableFacts: facts,
    missingFacts: missing,
    contentRisks: missing.map(item => `Não afirmar ${item} como fato nem preencher com conteúdo fictício.`),
    recommendedSections: recommended,
    avoidSections: [!reviews.length ? 'Depoimentos inventados' : '', !has(business.hours) ? 'Horários fictícios' : '', 'Contadores sem fonte', 'Preços não fornecidos'].filter(Boolean),
  });
}

function seedFor(value: string): number {
  let seed = 0;
  for (const char of value) seed = (seed * 31 + char.charCodeAt(0)) >>> 0;
  return seed;
}

export function createCreativeBrief(context: WebsiteGenerationContext, analysis: BusinessAnalysis): CreativeBrief {
  const niche = lower(context.business);
  const seed = seedFor(`${context.business.name}|${context.business.googlePlaceId}|${context.business.category}`);
  const directions = /marmor|arquitet|imobili|luxo/.test(niche)
    ? [
      ['Precisão monumental', 'marfim, grafite mineral e bronze discreto', 'Cormorant Garamond', 'Manrope'],
      ['Matéria e arquitetura', 'areia quente, carvão e verde mineral', 'DM Serif Display', 'Inter'],
    ]
    : /restaurante|pizz|bar|cafe|padaria|alimenta/.test(niche)
      ? [
        ['Mesa em primeiro plano', 'creme, vinho profundo e açafrão', 'Fraunces', 'Manrope'],
        ['Hospitalidade contemporânea', 'papel quente, oliva e terracota', 'DM Serif Display', 'Inter'],
      ]
      : /clinica|dent|medic|saude|estet/.test(niche)
        ? [
          ['Calma precisa', 'branco mineral, azul petróleo e sálvia', 'Instrument Serif', 'Manrope'],
          ['Cuidado contemporâneo', 'névoa, grafite e verde suave', 'Newsreader', 'Inter'],
        ]
        : [
          ['Confiança local contemporânea', 'off-white, grafite e verde profundo', 'DM Serif Display', 'Manrope'],
          ['Clareza com personalidade', 'papel, carvão e cobre discreto', 'Fraunces', 'Inter'],
        ];
  const [concept, palette, display, body] = directions[seed % directions.length];
  const realPhotos = context.assets.filter(asset => asset.isBusinessAsset).length;
  const sections = analysis.recommendedSections.map((type, index) => ({
    type,
    purpose: index === 0 ? 'Orientar e iniciar a narrativa.' : `Cumprir a função de ${type.toLowerCase()} sem conteúdo decorativo vazio.`,
    treatment: type.includes('Galeria') ? 'Composição editorial assimétrica com proporções controladas.' : index % 2 ? 'Ritmo editorial com texto e imagem em colunas desiguais.' : 'Bloco limpo, hierarquia tipográfica forte e espaço negativo.',
  }));
  return creativeBriefSchema.parse({
    concept,
    mood: /marmor|arquitet|imobili|luxo/.test(niche) ? ['preciso', 'material', 'sofisticado'] : /restaurante|alimenta/.test(niche) ? ['sensorial', 'acolhedor', 'autêntico'] : ['claro', 'confiável', 'contemporâneo'],
    paletteDirection: palette,
    typography: { display, body, rationale: 'Contraste entre uma voz editorial de marca e leitura funcional em telas pequenas.' },
    composition: 'Grid editorial de 12 colunas, seções com ritmos e densidades alternados, alinhamentos intencionais e poucos cards.',
    heroStrategy: realPhotos ? 'Usar a melhor fotografia real em grande escala, com recorte editorial e headline específica.' : 'Hero tipográfico forte; imagem licenciada apenas como apoio conceitual, sem fingir representar o estabelecimento.',
    imageDirection: realPhotos ? 'Priorizar ativos reais e preservar identidade visual; stock apenas para lacunas conceituais.' : 'Fotografia licenciada coerente com o nicho, luz e direção do briefing, claramente ilustrativa.',
    motionDirection: 'Reveal curto por seção, hover de 160–220ms e respeito obrigatório a prefers-reduced-motion.',
    conversionStrategy: analysis.primaryGoal,
    sectionPlan: sections,
    antiTemplateRules: ['Evitar sequência repetitiva de caixas iguais.', 'Não usar visual de dashboard/SaaS.', 'Não centralizar todas as seções.', 'Não repetir o mesmo tratamento visual em blocos consecutivos.', 'Cada seção precisa avançar a narrativa ou a conversão.'],
  });
}

export function buildAssetManifest(context: WebsiteGenerationContext): AssetManifest {
  const selected = context.assets.slice(0, 20).map(asset => ({
    token: `{{${asset.id}}}`,
    role: asset.sourceType === 'social' ? 'OFFICIAL_SOCIAL_ASSET' as const : asset.isBusinessAsset ? 'REAL_BUSINESS_PHOTO' as const : 'SUPPLEMENTAL_STOCK' as const,
    purpose: asset.usage || asset.kind || 'support',
    provider: asset.provider,
    alt: asset.alt,
    isBusinessAsset: Boolean(asset.isBusinessAsset),
  }));
  const realAssetCount = selected.filter(asset => asset.isBusinessAsset).length;
  return assetManifestSchema.parse({
    assets: selected,
    allowedTokens: selected.map(asset => asset.token),
    realAssetCount,
    strategy: realAssetCount
      ? 'Priorizar fotos reais nos pontos de maior confiança. Pedir stock somente para conceitos ausentes.'
      : 'Usar stock contextual como ilustração; nunca rotular como foto real da empresa.',
  });
}

export function strategyPromptBlock(analysis: BusinessAnalysis, brief: CreativeBrief, manifest: AssetManifest): string {
  return `VERSÃO DO PROMPT: ${WEBSITE_PROMPT_VERSION}\n\nANÁLISE DO NEGÓCIO (validada):\n${JSON.stringify(analysis, null, 2)}\n\nBRIEFING CRIATIVO (execute, não redesenhe genericamente):\n${JSON.stringify(brief, null, 2)}\n\nMANIFESTO DE ASSETS (somente estes tokens são imagens já autorizadas):\n${JSON.stringify(manifest, null, 2)}`;
}
