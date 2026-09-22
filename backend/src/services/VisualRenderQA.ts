import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import { env } from '../config/env';
import { generateJson, type GeminiVisionPart } from './GeminiService';
import type { ArtefactFiles } from './siteArtefactSchema';
import type { ArtDirectionPlan } from './ArtDirection';
import type { VisualQualityIssue } from './VisualQuality';

const viewSchema = z.object({
  width: z.number().int(), overflow: z.boolean(), contentHeight: z.number().nonnegative(),
  heroHeight: z.number().nonnegative(), ctaVisible: z.boolean(), brokenImages: z.number().int().nonnegative(), imageCount: z.number().int().nonnegative(),
  screenshot: z.string().optional(),
});
const resultSchema = z.object({ available: z.boolean(), error: z.string().optional(), views: z.array(viewSchema) });
export type BrowserVisualQA = z.infer<typeof resultSchema>;

const criticSchema = z.object({
  score: z.number().min(0).max(10),
  heroQuality: z.number().min(0).max(10),
  imageQuality: z.number().min(0).max(10),
  responsiveQuality: z.number().min(0).max(10),
  issues: z.array(z.object({ severity: z.enum(['critical', 'warning']), code: z.string().max(80), message: z.string().max(280), recommendation: z.string().max(420) })).max(12),
});
type VisionCritique = z.infer<typeof criticSchema>;

const scriptPath = resolve(process.cwd(), '..', 'frontend', 'scripts', 'site-visual-qa.mjs');

export async function renderForVisualQA(files: ArtefactFiles): Promise<BrowserVisualQA> {
  if (env.NODE_ENV === 'test' || !env.VISUAL_QA_ENABLED || !existsSync(scriptPath)) return { available: false, error: 'Visual QA desativado ou script indisponível.', views: [] };
  return new Promise(resolveResult => {
    const child = spawn(process.execPath, [scriptPath], { cwd: resolve(process.cwd(), '..', 'frontend'), windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => { child.kill(); resolveResult({ available: false, error: 'Visual QA excedeu o tempo permitido.', views: [] }); }, env.VISUAL_QA_TIMEOUT_MS);
    child.stdout.setEncoding('utf8'); child.stderr.setEncoding('utf8');
    child.stdout.on('data', chunk => { stdout += chunk; }); child.stderr.on('data', chunk => { stderr += chunk; });
    child.once('error', error => { clearTimeout(timer); resolveResult({ available: false, error: error.message, views: [] }); });
    child.once('close', () => {
      clearTimeout(timer);
      try { resolveResult(resultSchema.parse(JSON.parse(stdout))); }
      catch { resolveResult({ available: false, error: stderr.slice(0, 500) || 'Não foi possível processar o render visual.', views: [] }); }
    });
    child.stdin.end(JSON.stringify({ files, includeScreenshots: env.VISUAL_CRITIC_ENABLED }));
  });
}

export function browserVisualIssues(result: BrowserVisualQA): VisualQualityIssue[] {
  if (!result.available) return [{ severity: 'warning', code: 'visual_browser_qa_unavailable', message: 'A auditoria em navegador não ficou disponível nesta execução.', recommendation: 'Manter a auditoria estática e habilitar VISUAL_QA_ENABLED em ambiente com Playwright/Chromium.' }];
  const issues: VisualQualityIssue[] = [];
  const mobile = result.views.find(view => view.width === 390);
  const tablet = result.views.find(view => view.width === 768);
  const desktop = result.views.find(view => view.width === 1280);
  if (result.views.some(view => view.overflow)) issues.push({ severity: 'critical', code: 'render_horizontal_overflow', message: 'O navegador detectou conteúdo horizontal fora da viewport.', recommendation: 'Corrigir larguras fixas, grids e elementos posicionados para cada breakpoint.' });
  if (result.views.some(view => view.brokenImages > 0)) issues.push({ severity: 'critical', code: 'render_broken_image', message: 'Uma ou mais imagens não carregaram no navegador.', recommendation: 'Usar somente assets resolvidos pelo backend e aplicar fallback por slot.' });
  if (desktop && desktop.heroHeight < 420) issues.push({ severity: 'warning', code: 'render_weak_desktop_hero', message: 'A primeira dobra desktop ficou baixa para uma composição de alto impacto.', recommendation: 'Dar mais presença vertical à hero e preservar o protagonista visual.' });
  if (mobile && (!mobile.ctaVisible || mobile.heroHeight < 260)) issues.push({ severity: 'warning', code: 'render_mobile_hero_weak', message: 'A hero mobile não mantém CTA ou impacto suficiente.', recommendation: 'Recompor a primeira dobra em uma coluna e garantir CTA visível sem scroll horizontal.' });
  if (tablet && !tablet.ctaVisible) issues.push({ severity: 'warning', code: 'render_tablet_cta_hidden', message: 'O CTA principal não está visível no viewport tablet.', recommendation: 'Reposicionar CTA e navegação no breakpoint de tablet.' });
  return issues;
}

export async function critiqueScreenshots(result: BrowserVisualQA, plan: ArtDirectionPlan): Promise<VisionCritique | null> {
  if (!env.VISUAL_CRITIC_ENABLED || !result.available) return null;
  const screenshots = result.views.filter(view => view.screenshot).map(view => ({ mimeType: 'image/jpeg', data: view.screenshot! } satisfies GeminiVisionPart));
  if (!screenshots.length) return null;
  const prompt = `You are a strict premium web design critic. Assess the supplied desktop and mobile screenshots against this art direction. Do not invent business facts; evaluate only visual execution. Return concise, actionable issues.\n\nART DIRECTION:\n${JSON.stringify(plan)}\n\nCheck hero impact, imagery, typography, composition, card overuse, hierarchy, CTA clarity, responsiveness, clipping and agency-level polish.`;
  try {
    return criticSchema.parse(await generateJson(prompt, criticSchema, 'You are a rigorous visual critic. Never praise without concrete evidence. Return JSON only.', screenshots, { model: env.GEMINI_AUX_MODEL, thinkingLevel: 'low' }));
  } catch (error) {
    console.warn('[Visual critic] screenshot critique unavailable', { detail: error instanceof Error ? error.message.slice(0, 180) : 'unknown' });
    return null;
  }
}
