import type { ArtefactFiles, SiteAsset } from './siteArtefactSchema';
import type { ArtDirectionPlan } from './ArtDirection';

export type VisualQualityDimension =
  | 'visualImpact' | 'heroQuality' | 'composition' | 'typography' | 'imageQuality'
  | 'brandConsistency' | 'specificity' | 'spacing' | 'responsiveQuality'
  | 'conversionClarity' | 'originality' | 'professionalPolish';

export interface VisualQualityIssue {
  severity: 'critical' | 'warning';
  code: string;
  message: string;
  recommendation: string;
}

export interface VisualQualityReport {
  score: number;
  dimensions: Record<VisualQualityDimension, number>;
  issues: VisualQualityIssue[];
  needsRefinement: boolean;
}

const genericPhrases = [
  'qualidade e excelência', 'soluções personalizadas', 'transformando sonhos',
  'referência no mercado', 'get started', 'saiba mais sobre nossos serviços',
];

function count(value: string, expression: RegExp): number { return value.match(expression)?.length ?? 0; }
function includes(value: string, expression: RegExp): boolean { return expression.test(value); }
function clampNumber(css: string): number | null {
  const match = /font-size\s*:\s*clamp\(\s*([\d.]+)rem\s*,\s*([\d.]+)vw\s*,\s*([\d.]+)rem/i.exec(css);
  return match ? Number(match[3]) : null;
}
function average(values: number[]): number { return Math.round((values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1)) * 10) / 10; }

/**
 * Static visual critic used on every generation. It deliberately does not claim
 * to see pixels; optional browser screenshot QA supplements it when enabled.
 */
export function assessVisualQuality(files: ArtefactFiles, plan: ArtDirectionPlan, assets: SiteAsset[] = []): VisualQualityReport {
  const html = files['index.html'] || '';
  const css = files['styles.css'] || '';
  const combined = `${html}\n${css}`.toLocaleLowerCase('pt-BR');
  const issues: VisualQualityIssue[] = [];
  const score = (condition: boolean, yes: number, no: number) => condition ? yes : no;

  const hasHero = includes(html, /<(?:section|header)\b[^>]*(?:id\s*=\s*["']hero|class\s*=\s*["'][^"']*hero)/i);
  const heroHasMedia = hasHero && includes(html, /(?:hero[\s\S]{0,2500}<img\b|<img\b[\s\S]{0,2500}hero)/i);
  const heroHasScale = includes(css, /(?:\.hero[^\{]*\{[\s\S]{0,700}(?:min-height|padding-block|padding)[\s\S]{0,250}|font-size\s*:\s*clamp)/i);
  const headlineScale = clampNumber(css);
  const visualImpact = average([score(hasHero, 8.5, 2), score(heroHasMedia, 9, 4), score(heroHasScale, 8.5, 5), score((headlineScale ?? 0) >= 3.5, 9, 6)]);
  const heroQuality = average([score(hasHero, 8.5, 2), score(heroHasMedia || plan.hero.archetype === 'MINIMAL_PRODUCT', 9, 4), score(includes(combined, /hero[^\n]{0,150}(?:asymmetr|overlay|absolute|grid|layer|editorial|full-bleed)/i), 8.5, 6), score(includes(html, /<(?:a|button)\b[^>]*(?:href|type)/i), 8, 5)]);

  const gridCount = count(css, /(?:display\s*:\s*grid|grid-template-columns)/gi);
  const asymmetric = includes(css, /grid-template-columns\s*:\s*(?!repeat\(\s*3|1fr\s+1fr)(?:[^;}]*\b(?:1\.2|1\.3|1\.4|1\.5|1\.6|1\.7|1\.8|2fr|3fr)|[^;}]*minmax)/i);
  const overlap = includes(css, /(?:position\s*:\s*absolute|transform\s*:\s*translate|margin-(?:top|left)\s*:\s*-[\d.])/i);
  const cards = count(html, /class\s*=\s*["'][^"']*(?:card|tile|panel)[^"']*["']/gi);
  const composition = average([score(gridCount >= 2, 8.5, 5.5), score(asymmetric || overlap, 8.5, 6), cards > 9 ? 4.5 : cards >= 1 ? 8 : 7]);

  const displayKnown = includes(css, new RegExp(plan.typographyStrategy.display.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  const bodyKnown = includes(css, new RegExp(plan.typographyStrategy.body.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  const typography = average([score(/font-family\s*:/i.test(css), 8, 3), score(displayKnown, 9, 6), score(bodyKnown, 8.5, 6), score((headlineScale ?? 0) >= 3.5, 9, 5)]);

  const images = count(html, /<img\b/gi);
  const realAssets = assets.filter(asset => asset.isBusinessAsset || asset.sourceType === 'business' || asset.sourceType === 'social').length;
  const imgHasFit = includes(css, /object-fit\s*:\s*cover/i);
  const imageQuality = average([score(images >= 1, 8.5, 2), score(heroHasMedia, 9, 4), score(imgHasFit, 8.5, 5), score(realAssets > 0 || assets.length > 0, 8.5, 6)]);

  const tokens = ['--bg', '--background', '--surface', '--text', '--accent', '--font-display', '--font-body'];
  const tokenHits = tokens.filter(token => css.includes(token)).length;
  const brandConsistency = average([score(tokenHits >= 5, 9, tokenHits >= 3 ? 7 : 4), score(includes(css, /border-radius\s*:\s*var\(|--radius/i), 8, 6), score(includes(css, /(?:--space|clamp\()/i), 8.5, 6)]);

  const genericCount = genericPhrases.filter(phrase => combined.includes(phrase)).length;
  const businessMention = html.toLocaleLowerCase('pt-BR').includes(plan.businessType.toLocaleLowerCase('pt-BR')) || html.toLocaleLowerCase('pt-BR').includes('whatsapp') || html.toLocaleLowerCase('pt-BR').includes('contato');
  const specificity = average([genericCount === 0 ? 9 : Math.max(4, 8 - genericCount * 2), score(businessMention, 8, 5), score(plan.primaryArchetype !== 'generic_local_service', 8.5, 6.5)]);

  const whitespace = includes(css, /(?:padding|margin)\s*:\s*(?:clamp\(|[3-9]rem|[4-9]vw)/i);
  const lineHeight = includes(css, /line-height\s*:\s*(?:1\.[3-9]|[2-9])/i);
  const spacing = average([score(whitespace, 8.5, 5), score(lineHeight, 8, 5), score(gridCount >= 2, 8, 6)]);

  const mobile390 = includes(css, /@media[^\{]*max-width\s*:\s*(?:3[6-9]\d|4\d\d)px/i);
  const tablet = includes(css, /@media[^\{]*max-width\s*:\s*(?:7\d\d|8\d\d)px/i);
  const desktop = includes(css, /@media[^\{]*(?:min-width\s*:\s*(?:1024|1280)px|max-width\s*:\s*1024px)/i);
  const responsiveQuality = average([score(mobile390, 9, 5), score(tablet, 8.5, 5), score(desktop, 8, 6), score(!includes(css, /transform\s*:\s*scale\(/i), 9, 3)]);

  const actionable = count(html, /<(?:a|button)\b[^>]*(?:href|type)/gi);
  const conversionClarity = average([score(actionable >= 2, 8.5, 5), score(includes(html, /(?:wa\.me|tel:|mailto:|maps\.google|#contato)/i), 9, 5), score(includes(css, /(?:btn|button)[^\{]*\{/i), 8, 5)]);
  const originality = average([score(plan.hero.archetype !== 'CINEMATIC_SPLIT' || asymmetric || overlap, 8.5, 6), cards > 9 ? 4 : score(cards <= 5, 8.5, 7), score(plan.visualKeywords.length >= 4, 8, 6)]);
  const professionalPolish = average([score(/:focus-visible/i.test(css), 8.5, 4), score(/prefers-reduced-motion/i.test(css), 8.5, 5), score(/loading\s*=\s*["']lazy/i.test(html) || images <= 1, 8, 5), score(css.length >= 1800, 8.5, 5)]);

  const dimensions = { visualImpact, heroQuality, composition, typography, imageQuality, brandConsistency, specificity, spacing, responsiveQuality, conversionClarity, originality, professionalPolish };
  const dimensionsBelow = (Object.entries(dimensions) as Array<[VisualQualityDimension, number]>).filter(([, value]) => value < 8.5);
  if (!hasHero) issues.push({ severity: 'critical', code: 'visual_missing_hero', message: 'A página não tem uma hero identificável.', recommendation: 'Criar uma primeira dobra com o conceito dominante do ART_DIRECTION_PLAN.' });
  if (!heroHasMedia) issues.push({ severity: 'warning', code: 'visual_hero_without_media', message: 'A hero não usa uma mídia renderizada.', recommendation: `Usar uma imagem resolvida com ${plan.imageDirection.composition.toLowerCase()}.` });
  if ((headlineScale ?? 0) < 3.5) issues.push({ severity: 'warning', code: 'visual_weak_headline_scale', message: 'A headline não tem escala de impacto suficiente.', recommendation: 'Usar uma escala fluida de headline coerente com a composição, sem perder legibilidade no mobile.' });
  if (!asymmetric && !overlap) issues.push({ severity: 'warning', code: 'visual_generic_composition', message: 'A composição não demonstra assimetria, sobreposição ou grid editorial.', recommendation: `Implementar ${plan.hero.archetype} com a relação texto/imagem definida no plano.` });
  if (cards > 9) issues.push({ severity: 'warning', code: 'visual_excessive_cards', message: 'Há cartões demais para uma direção editorial premium.', recommendation: 'Trocar parte dos cards por seções abertas com tipografia, mídia e espaço negativo.' });
  if (genericCount) issues.push({ severity: 'warning', code: 'visual_generic_copy', message: 'A copy contém clichês de marketing genéricos.', recommendation: 'Reescrever usando somente o contexto local e a intenção de conversão verificada.' });
  if (!mobile390 || !tablet) issues.push({ severity: 'warning', code: 'visual_incomplete_breakpoints', message: 'A composição não cobre de forma explícita mobile pequeno e tablet.', recommendation: 'Adicionar regras para 390px e 768px que recomponham a hero, navegação e CTAs.' });
  if (!displayKnown || !bodyKnown) issues.push({ severity: 'warning', code: 'visual_typography_plan_not_applied', message: 'A combinação tipográfica prevista não foi aplicada integralmente.', recommendation: `Aplicar ${plan.typographyStrategy.display} em display e ${plan.typographyStrategy.body} no corpo por meio do carregador controlado de fontes.` });

  const values = Object.values(dimensions);
  const total = average(values);
  const criticalBelow = heroQuality < 6 || imageQuality < 6 || responsiveQuality < 6 || visualImpact < 6;
  return { score: total, dimensions, issues, needsRefinement: criticalBelow || dimensionsBelow.length >= 4 || total < 8.5 };
}
