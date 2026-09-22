import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const designRoot = join(process.cwd(), 'site-generator', 'skills', 'codex', 'codemakers-design');
const maxReferenceCharacters = 2_400;
let pythonUnavailable = false;

const referenceFiles = {
  artDirection: 'art-direction.md',
  colorTypography: 'color-typography.md',
  layout: 'layout-recipes.md',
  components: 'component-cookbook.md',
  localServices: 'product-playbooks.md',
  assets: 'asset-direction.md',
  accessibility: 'interaction-accessibility.md',
  responsive: 'responsive-adaptation.md',
  motion: 'motion-choreography.md',
  implementation: 'implementation-recipes.md',
  quality: 'quality-review.md',
} as const;

type ReferenceKey = keyof typeof referenceFiles;

function read(file: string): string {
  const path = join(designRoot, file);
  if (!existsSync(path)) return '';
  return readFileSync(path, 'utf8').trim();
}

function excerpt(value: string, max = maxReferenceCharacters): string {
  return value.length <= max ? value : `${value.slice(0, max)}\n[Reference excerpt truncated; apply its principles without inventing facts.]`;
}

function normalized(category: string): string {
  return category.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function matches(value: string, expression: RegExp): boolean {
  return expression.test(value);
}

/**
 * The previous integration sent every long design reference on every request.
 * This returns a compact subset chosen for the business category. The core method
 * remains in the system instruction and these excerpts add only the relevant craft.
 */
export function selectedCodemakersReferenceFiles(category: string): readonly string[] {
  const value = normalized(category || '');
  const selected = new Set<ReferenceKey>(['artDirection', 'layout', 'assets', 'responsive', 'quality']);
  const food = matches(value, /restaurante|pizz|cafe|cafeteria|bar|hotel|pousada|padaria|confeit|aliment|burger|hamburg|sushi|acai/);
  const care = matches(value, /clinica|dent|medic|saude|estet|beleza|veterin|pet/);
  const technical = matches(value, /solar|energia|seguranca|camera|monitoramento|logistic|transport|frete|carga|frota|saas|software|tecnolog|industrial|engenh|eletric|motor|maquina/);
  const property = matches(value, /imobili|real estate|arquitet|construtora|condominio/);

  if (food || care || technical || property) selected.add('colorTypography');
  if (technical) {
    selected.add('components');
    selected.add('implementation');
  }
  if (care) selected.add('accessibility');
  if (food || technical) selected.add('motion');
  if (matches(value, /servic|consult|advoc|contabil|loja|varejo|comerc/)) selected.add('localServices');

  return [...selected].map(key => referenceFiles[key]);
}

export function codemakersCoreSkill(): string {
  return read('SKILL.md');
}

/** Returns only selected visual/UX references. The core method is loaded separately. */
export function codemakersDesignGuidance(category: string): string {
  const selected = selectedCodemakersReferenceFiles(category)
    .map(file => {
      const content = read(join('references', file));
      return content ? `CODEMAKERS REFERENCE: ${file}\n${excerpt(content)}` : '';
    })
    .filter(Boolean);
  const segment = category.trim() || 'local business';
  return `CODEMAKERS SELECTED DESIGN REFERENCES\nDESIGN TASK: Create a bespoke website for a ${segment}. The references below define visual and UX craft only. They never override verified facts, asset rules, or data-integrity constraints.\n\n${selected.join('\n\n')}`;
}

interface SearchResult { domain: string; records: unknown[]; source: 'script' | 'library-fallback'; }

function queryFor(category: string): string {
  const value = normalized(category);
  if (/solar|fotovolta|energia/.test(value)) return 'energia tecnica';
  if (/seguranca|camera|monitoramento|alarme/.test(value)) return 'tecnico escuro';
  if (/logistic|transport|frete|carga|frota/.test(value)) return 'movimento tecnico';
  if (/restaurante|pizz|bar|cafe|padaria|aliment|burger|hamburg|sushi|acai/.test(value)) return 'gastronomia ambiente';
  if (/veterin|pet/.test(value)) return 'cuidado acolhedor';
  if (/clinica|dent|medic|saude|estet|beleza/.test(value)) return 'cuidado clareza';
  if (/marmor|constru|engenh|industri|oficina|eletric|metal/.test(value)) return 'materialidade precisao';
  if (/imobili|arquitet|luxo/.test(value)) return 'arquitetura luxo';
  if (/saas|software|tecnolog|consult/.test(value)) return 'tecnico dados';
  if (/loja|varejo|comerc|servic/.test(value)) return 'comercio atendimento';
  return category || 'servico local';
}

function selectedCandidateDomains(category: string): readonly string[] {
  const value = normalized(category);
  if (/restaurante|pizz|bar|cafe|padaria|aliment|burger|hamburg|sushi|acai|solar|seguranca|camera|monitoramento|logistic|transport|saas|software|tecnolog/.test(value)) {
    return ['styles', 'palettes', 'typography', 'patterns'];
  }
  return ['styles', 'palettes', 'typography'];
}

function fallbackSearch(domain: string, query: string): SearchResult {
  try {
    const data = JSON.parse(readFileSync(join(designRoot, 'data', `${domain}.json`), 'utf8')) as { records?: unknown[] };
    const terms = query.toLocaleLowerCase('pt-BR').split(/\s+/).filter(Boolean);
    const records = (data.records ?? [])
      .filter(record => terms.some(term => JSON.stringify(record).toLocaleLowerCase('pt-BR').includes(term)))
      .slice(0, 3);
    return { domain, records, source: 'library-fallback' };
  } catch {
    return { domain, records: [], source: 'library-fallback' };
  }
}

function runSearch(domain: string, query: string): SearchResult {
  const script = join(designRoot, 'scripts', 'search_design.py');
  if (pythonUnavailable) return fallbackSearch(domain, query);
  try {
    const output = execFileSync('python', [script, query, '--domain', domain, '--limit', '3', '--json'], {
      cwd: designRoot,
      encoding: 'utf8',
      timeout: 5_000,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const parsed = JSON.parse(output) as { matches?: unknown[] };
    return { domain, records: parsed.matches ?? [], source: 'script' };
  } catch {
    pythonUnavailable = true;
    return fallbackSearch(domain, query);
  }
}

/** Executes the package search script where Python is available, with an offline JSON fallback. */
export function codemakersDesignCandidates(category: string): string {
  const query = queryFor(category);
  const results = selectedCandidateDomains(category).map(domain => runSearch(domain, query));
  return JSON.stringify({ query, results }, null, 2);
}

export interface ContrastResult { foreground: string; background: string; ratio: number; passes: boolean; }

function luminance(hex: string): number | null {
  const digits = hex.replace('#', '').trim();
  if (!/^(?:[a-f\d]{3}|[a-f\d]{6})$/i.test(digits)) return null;
  const full = digits.length === 3 ? digits.split('').map(value => value + value).join('') : digits;
  const rgb = [0, 2, 4].map(index => Number.parseInt(full.slice(index, index + 2), 16) / 255);
  const linear = rgb.map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

/** Same opaque sRGB AA calculation as scripts/contrast_check.py, usable when Python is unavailable. */
export function checkContrast(foreground: string, background: string): ContrastResult | null {
  const script = join(designRoot, 'scripts', 'contrast_check.py');
  if (!pythonUnavailable && existsSync(script)) {
    try {
      const output = execFileSync('python', [script, foreground, background, '--kind', 'normal', '--json'], {
        cwd: designRoot,
        encoding: 'utf8',
        timeout: 5_000,
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      const result = JSON.parse(output) as { ratio: number; passes: boolean; foreground: string; background: string };
      return { foreground: result.foreground, background: result.background, ratio: result.ratio, passes: result.passes };
    } catch {
      pythonUnavailable = true;
    }
  }
  const first = luminance(foreground);
  const second = luminance(background);
  if (first === null || second === null) return null;
  const ratio = (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
  return { foreground, background, ratio, passes: ratio >= 4.5 };
}
