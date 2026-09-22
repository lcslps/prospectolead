import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { codemakersCoreSkill, codemakersDesignCandidates, codemakersDesignGuidance } from './CodemakersDesign';

const root = join(process.cwd(), 'site-generator');
const cache = new Map<string, string>();

function read(relative: string): string {
  const cached = cache.get(relative);
  if (cached) return cached;
  try {
    const value = readFileSync(join(root, relative), 'utf8').trim();
    if (!value) throw new Error('arquivo vazio');
    cache.set(relative, value);
    return value;
  } catch (error) {
    throw new Error(`Arquivo do gerador indisponivel: site-generator/${relative}. ${(error as Error).message}`);
  }
}

function renderSkills(files: readonly string[]): string {
  return files.map(file => `SKILL: ${file}\n${read(`skills/${file}`)}`).join('\n\n');
}

function normalized(category: string): string {
  return category.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function siteSystemPrompt(): string { return read('prompts/site-system.md'); }
export function siteRepairPrompt(): string { return read('prompts/site-repair.md'); }

/**
 * These files establish rules that must apply to every generation, independent of
 * visual direction. Visual and segment-specific material is selected separately.
 */
const essentialSkillFiles = [
  'data-integrity.md',
  'local-business.md',
  'images.md',
  'conversion.md',
  'accessibility.md',
  'responsive.md',
  'local-seo.md',
] as const;

const visualCoreSkillFiles = [
  'art-director.md',
  'visual-composition.md',
  'image-director.md',
  'visual-critic.md',
] as const;

const segmentRules = [
  ['food-hospitality.md', /restaurante|pizz|cafe|cafeteria|bar|hotel|pousada|padaria|confeit|aliment|burger|hamburg|sushi|acai/],
  ['home-industrial.md', /marmor|granito|constru|obra|engenh|arquitet|industri|oficina|metal|solar|eletric|motor|maquina/],
  ['health-beauty.md', /clinica|dent|medic|saude|estet|barbear|cabeleir|beleza|veterin|pet/],
  ['retail-services.md', /loja|varejo|moda|moveis|imobili|advoc|servic|comerc|contabil|consult/],
] as const;

const nicheRules = [
  ['niche-solar-energy.md', /solar|fotovolta|energia renovavel/],
  ['niche-electronic-security.md', /seguranca|camera|monitoramento|alarme|controle de acesso/],
  ['niche-transport-logistics.md', /logistic|transport|frete|carga|frota|entrega/],
  ['niche-veterinary-pet.md', /veterin|pet shop|petshop|animal/],
  ['niche-luxury-real-estate.md', /imobili|real estate|incorporadora|propriedade|condominio/],
  ['niche-food-campaign.md', /restaurante|pizz|cafe|cafeteria|bar|hotel|pousada|padaria|confeit|aliment|burger|hamburg|sushi|acai/],
  ['niche-technology-consulting.md', /saas|software|tecnolog|consult|digital|dados|automacao/],
] as const;

export function selectedSkillFiles(category: string): readonly string[] {
  const value = normalized(category || '');
  const selected = new Set<string>(visualCoreSkillFiles);

  const segment = segmentRules.find(([, matcher]) => matcher.test(value))?.[0];
  if (segment) selected.add(segment);

  const niche = nicheRules.find(([, matcher]) => matcher.test(value))?.[0];
  if (niche) selected.add(niche);

  // Keep the generic fallback compact. A category with a dedicated visual grammar
  // does not receive every broad design skill as prompt ballast.
  if (!segment && !niche) {
    selected.add('frontend-design.md');
    selected.add('typography.md');
    selected.add('copywriting.md');
  }

  return [...selected];
}

/** Kept as the SitePrompt API: it now emits only non-negotiable common rules. */
export function professionalSkills(): string {
  return renderSkills(essentialSkillFiles);
}

/** Kept as the SitePrompt API: visual and niche skills are selected by category. */
export function relevantSkills(category: string): string {
  return renderSkills(selectedSkillFiles(category));
}

export function codemakersSkills(category: string): string {
  return `${codemakersDesignGuidance(category)}

DESIGN LIBRARY CANDIDATES (search results are candidates, never automatic prescriptions):
${codemakersDesignCandidates(category)}`;
}

export function codemakersSystemMethod(): string {
  return `DESIGN INTEGRATION HIERARCHY:
1. Verified business facts and explicit client requests are the source of truth.
2. The local essential skills, especially data-integrity.md and images.md, are non-negotiable limits on what may be claimed or shown.
3. The selected visual, niche and CodeMakers material improves only how the site is composed, styled, implemented and reviewed. It can never create business facts, image URLs or claims.
4. Read the core design method below for every generation. Add visual and reference material only when it is selected for the business; never copy brand studies or their numeric tokens literally.
5. Before final output, apply the quality checklist: factual accuracy, one working primary action, local SEO facts, AA contrast, keyboard/focus/reduced-motion, 375/768/1280 responsiveness, real-photo priority and segment-appropriate visual language.

CODEMAKERS CORE METHOD:
${codemakersCoreSkill()}`;
}
