import type { ArtefactFiles } from './siteArtefactSchema';
import { checkContrast } from './CodemakersDesign';

export interface QualityIssue {
  severity: 'critical' | 'warning';
  code: string;
  message: string;
}

export interface QualityAudit {
  score: number;
  issues: QualityIssue[];
  needsRepair: boolean;
  dimensions: {
    structure: number;
    responsive: number;
    accessibility: number;
    visualSystem: number;
    performance: number;
  };
}

const TOKEN_PATTERN = /\{\{[A-Za-z0-9_-]+\}\}/;

function rootColor(css: string, names: string[]): string | null {
  const root = /:root\s*\{([\s\S]*?)\}/i.exec(css)?.[1] ?? '';
  for (const name of names) {
    const match = new RegExp(`--(?:[\\w-]*${name}[\\w-]*)\\s*:\\s*(#[a-f\\d]{3,6})\\b`, 'i').exec(root);
    if (match) return match[1];
  }
  return null;
}

function contrastIssues(css: string): QualityIssue[] {
  const background = rootColor(css, ['background', 'bg']);
  const surface = rootColor(css, ['surface', 'card']);
  const text = rootColor(css, ['text', 'foreground', 'ink']);
  const muted = rootColor(css, ['muted']);
  const pairs: Array<[string | null, string | null, string]> = [
    [text, background, 'texto principal/fundo'],
    [text, surface, 'texto principal/superfície'],
    [muted, background, 'texto secundário/fundo'],
  ];
  for (const [foreground, backdrop, label] of pairs) {
    if (!foreground || !backdrop) continue;
    const result = checkContrast(foreground, backdrop);
    if (result && !result.passes) {
      return [{ severity: 'critical', code: 'contrast_aa_failure', message: `O contraste ${label} (${result.ratio.toFixed(2)}:1) não atende AA para texto normal.` }];
    }
  }
  return [];
}

export function inspectArtifact(files: ArtefactFiles): QualityIssue[] {
  const issues: QualityIssue[] = [];
  const html = files['index.html'] || '';
  const css = files['styles.css'] || '';
  const combined = `${html}\n${css}`;

  if (html.length < 900) {
    issues.push({ severity: 'critical', code: 'undersized_html', message: 'O HTML está curto demais para um site profissional completo; faltam estrutura e conteúdo visual.' });
  }
  if (css.length < 600) {
    issues.push({ severity: 'critical', code: 'undersized_css', message: 'A folha de estilos está curta demais para garantir uma composição visual profissional e responsiva.' });
  }
  if (/<link\b[^>]*\brel\s*=\s*["']?stylesheet["']?[^>]*\bhref\s*=\s*["']\s*["']/i.test(html)) {
    issues.push({ severity: 'critical', code: 'empty_stylesheet_link', message: 'Há uma folha de estilos com href vazio, o que deixa o site sem apresentação visual.' });
  }

  if (!/<html[\s>]/i.test(html)) {
    issues.push({ severity: 'critical', code: 'missing_html_root', message: 'Documento sem raiz <html>: o cabeçalho pode não ser processado corretamente.' });
  }
  if (!/<title\b[^>]*>[\s\S]*?<\/title>/i.test(html)) {
    issues.push({ severity: 'critical', code: 'missing_title', message: 'Sem <title>: o SEO da página fica incompleto.' });
  }
  if (!/<meta\b[^>]*name\s*=\s*["']?viewport["']?/i.test(html)) {
    issues.push({ severity: 'critical', code: 'missing_viewport', message: 'Sem meta viewport: a página não será responsiva no celular.' });
  }
  if (TOKEN_PATTERN.test(combined)) {
    issues.push({ severity: 'critical', code: 'unresolved_token', message: 'Restaram tokens de imagem não resolvidos ({{...}}).' });
  }

  if (/\bdata-intent-id\s*=/i.test(html)) {
    issues.push({ severity: 'critical', code: 'unresolved_image_intent', message: 'Restou um placeholder de imagem sem um asset resolvido.' });
  }
  const images = html.match(/<img\b[^>]*>/gi) ?? [];
  for (const img of images) {
    const src = /src\s*=\s*["']([^"']*)["']/i.exec(img)?.[1] ?? '';
    if (!src.trim()) {
      issues.push({ severity: 'critical', code: 'empty_img_src', message: 'Existe <img> sem src (imagem quebrada).' });
      break;
    }
    if (TOKEN_PATTERN.test(src)) {
      issues.push({ severity: 'critical', code: 'unresolved_token', message: 'Existe <img> com token de imagem não resolvido.' });
      break;
    }
    if (!/\balt\s*=\s*["'][^"']+["']/i.test(img)) {
      issues.push({ severity: 'warning', code: 'missing_image_alt', message: 'Existe imagem sem texto alternativo descritivo.' });
      break;
    }
  }

  const hasVisual = images.length > 0 || /\bbackground(?:-image)?\s*:\s*[^;]*(?:url\(|gradient\()/i.test(css);
  if (!hasVisual) {
    issues.push({ severity: 'critical', code: 'missing_visual_asset', message: 'O site não possui nenhum visual renderizável; isso deixa a composição vazia.' });
  }
  if (!/@media/i.test(css)) {
    issues.push({ severity: 'warning', code: 'no_media_queries', message: 'Nenhuma media query encontrada: a responsividade pode estar comprometida.' });
  }
  if (!/:root/i.test(css)) {
    issues.push({ severity: 'warning', code: 'no_design_tokens', message: 'Nenhum token de design no :root: a consistência visual pode sofrer.' });
  }
  if (!/<main\b/i.test(html)) {
    issues.push({ severity: 'warning', code: 'missing_main', message: 'Sem <main>: a estrutura semântica pode ser melhorada.' });
  }
  if (!/<h1\b/i.test(html)) {
    issues.push({ severity: 'critical', code: 'missing_h1', message: 'Sem título principal <h1>.' });
  }
  if (!/loading\s*=\s*["']lazy["']/i.test(html) && images.length > 2) {
    issues.push({ severity: 'warning', code: 'no_lazy_images', message: 'Galeria sem carregamento tardio de imagens.' });
  }
  if (!/@media[^\{]*\(max-width\s*:/i.test(css)) {
    issues.push({ severity: 'warning', code: 'no_mobile_breakpoint', message: 'Sem breakpoint de celular explícito.' });
  }
  if (/\b(?:javascript|vbscript)\s*:/i.test(combined)) {
    issues.push({ severity: 'critical', code: 'unsafe_protocol', message: 'Foi encontrado protocolo inseguro.' });
  }
  if (!/:focus-visible/i.test(css)) {
    issues.push({ severity: 'warning', code: 'no_focus_visible', message: 'Não há estado de foco visível para navegação por teclado.' });
  }
  if (!/prefers-reduced-motion/i.test(css) && /animation|transition/i.test(css)) {
    issues.push({ severity: 'warning', code: 'no_reduced_motion', message: 'Há movimento sem tratamento para prefers-reduced-motion.' });
  }
  if (!/clamp\(/i.test(css)) {
    issues.push({ severity: 'warning', code: 'no_fluid_type', message: 'A tipografia não usa escala fluida com clamp().' });
  }
  if (!/grid-template-columns|display\s*:\s*grid/i.test(css)) {
    issues.push({ severity: 'warning', code: 'no_layout_grid', message: 'Não foi encontrada uma grade responsiva explícita.' });
  }
  if ((html.match(/class\s*=\s*["'][^"']*(?:card|box)[^"']*["']/gi) ?? []).length > 12) {
    issues.push({ severity: 'warning', code: 'excessive_cards', message: 'O layout usa caixas demais e pode parecer um template genérico.' });
  }
  if (!/<nav\b/i.test(html) || !/<footer\b/i.test(html)) {
    issues.push({ severity: 'warning', code: 'incomplete_landmarks', message: 'A página precisa de navegação e rodapé semânticos.' });
  }

  issues.push(...contrastIssues(css));
  return issues;
}

export function auditArtifact(files: ArtefactFiles): QualityAudit {
  const issues = inspectArtifact(files);
  const penalty = issues.reduce((sum, issue) => sum + (issue.severity === 'critical' ? 18 : 4), 0);
  const codes = new Set(issues.map(issue => issue.code));
  const dimension = (relevant: string[]) => Math.max(0, 100 - relevant.filter(code => codes.has(code)).length * 20);
  const score = Math.max(0, Math.min(100, 100 - penalty));
  return {
    score,
    issues,
    needsRepair: issues.some(issue => issue.severity === 'critical') || score < 72,
    dimensions: {
      structure: dimension(['missing_html_root', 'missing_title', 'missing_viewport', 'missing_main', 'missing_h1', 'incomplete_landmarks']),
      responsive: dimension(['no_media_queries', 'no_mobile_breakpoint', 'no_fluid_type', 'no_layout_grid']),
      accessibility: dimension(['missing_image_alt', 'no_focus_visible', 'no_reduced_motion', 'unsafe_protocol']),
      visualSystem: dimension(['no_design_tokens', 'excessive_cards']),
      performance: dimension(['no_lazy_images', 'unresolved_token', 'unresolved_image_intent', 'empty_img_src', 'missing_visual_asset']),
    },
  };
}

export function criticalIssues(issues: QualityIssue[]): QualityIssue[] {
  return issues.filter(issue => issue.severity === 'critical');
}
