import type { ArtefactFiles } from './siteArtefactSchema';

export interface QualityIssue {
  severity: 'critical' | 'warning';
  code: string;
  message: string;
}

const TOKEN_PATTERN = /\{\{[A-Za-z0-9_-]+\}\}/;

export function inspectArtifact(files: ArtefactFiles): QualityIssue[] {
  const issues: QualityIssue[] = [];
  const html = files['index.html'] || '';
  const css = files['styles.css'] || '';
  const combined = `${html}\n${css}`;

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

  return issues;
}

export function criticalIssues(issues: QualityIssue[]): QualityIssue[] {
  return issues.filter(issue => issue.severity === 'critical');
}
