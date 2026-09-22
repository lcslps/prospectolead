import { readFileSync } from 'node:fs';
import { join } from 'node:path';

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
  'frontend-design.md', 'typography.md', 'images.md', 'animations.md', 'copywriting.md',
  'conversion.md', 'responsive.md', 'accessibility.md', 'local-seo.md', 'data-integrity.md',
] as const;

export function professionalSkills(): string {
  return professionalSkillFiles
    .map(file => `SKILL: ${file}\n${read(`skills/${file}`)}`)
    .join('\n\n');
}
