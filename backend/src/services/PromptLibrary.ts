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
    throw new Error(`Arquivo do gerador indisponível: site-generator/${relative}. ${(error as Error).message}`);
  }
}

export function siteSystemPrompt(): string { return read('prompts/site-system.md'); }
export function siteRepairPrompt(): string { return read('prompts/site-repair.md'); }

const skills = [
  ['food-hospitality.md', /restaurante|pizz|cafe|cafeteria|bar|hotel|pousada|padaria|confeit|aliment/i],
  ['home-industrial.md', /marmor|granito|constru|obra|engenh|arquitet|industri|oficina|metal|solar|eletric|motor|maquina/i],
  ['health-beauty.md', /clinica|dent|medic|saude|estet|barbear|cabeleir|beleza|veterin/i],
  ['retail-services.md', /loja|varejo|moda|moveis|imobili|advoc|servic|comerc/i],
] as const;

export function relevantSkills(category: string, max = 2): string {
  const categoryText = category || '';
  const selected = ['foundations.md', 'local-business.md'];
  for (const [file, matcher] of skills) {
    if (matcher.test(categoryText)) selected.push(file);
    if (selected.length >= max + 2) break;
  }
  return selected.map(file => `SKILL: ${file}\n${read(`skills/${file}`)}`).join('\n\n');
}

const professionalSkillFiles = [
  'accessibility.md', 'animations.md', 'conversion.md', 'copywriting.md', 'data-integrity.md',
  'foundations.md', 'frontend-design.md', 'images.md', 'local-business.md', 'local-seo.md',
  'responsive.md', 'typography.md', 'food-hospitality.md', 'health-beauty.md', 'home-industrial.md',
  'retail-services.md',
] as const;

export function professionalSkills(): string {
  return professionalSkillFiles
    .map(file => `SKILL: ${file}\n${read(`skills/${file}`)}`)
    .join('\n\n');
}

export function codemakersSkills(category: string): string {
  return `${codemakersDesignGuidance(category)}

DESIGN LIBRARY CANDIDATES (search results are candidates, never automatic prescriptions):
${codemakersDesignCandidates(category)}`;
}

export function codemakersSystemMethod(): string {
  return `DESIGN INTEGRATION HIERARCHY:
1. Verified business facts and explicit client requests are the source of truth.
2. The local skills, especially data-integrity.md and images.md, are non-negotiable limits on what may be claimed or shown.
3. The CodeMakers Design method improves only how the site is composed, styled, implemented and reviewed. It can never create business facts, image URLs or claims.
4. Read the core design method below for every generation. Consult selected reference material only when it is relevant to the task; never copy brand studies or their numeric tokens literally.
5. Before final output, apply the quality checklist: factual accuracy, one working primary action, local SEO facts, AA contrast, keyboard/focus/reduced-motion, 375/768/1280 responsiveness, real-photo priority and segment-appropriate visual language.

CODEMAKERS CORE METHOD:
${codemakersCoreSkill()}`;
}
