import type { ArtefactFiles } from './siteArtefactSchema';

export interface SanitizeResult {
  files: ArtefactFiles;
  warnings: string[];
}

const IMAGE_DATA_URL = /^data:image\/(png|jpeg|webp|gif);base64,/i;
const SAFE_PREFIX = /^(https:\/\/|\/|#|tel:|mailto:)/i;
const UNSAFE_URL = /^(?:javascript|vbscript|data:text\/html|data:application)/i;

export function sanitizeUrl(value: string | undefined | null): string {
  if (!value) return value ?? '';
  const trimmed = value.trim();
  if (UNSAFE_URL.test(trimmed.replace(/\s+/g, '').toLowerCase())) return '';
  if (IMAGE_DATA_URL.test(trimmed) || SAFE_PREFIX.test(trimmed)) return trimmed;
  return '';
}

function sanitizeAttributeUrls(html: string): string {
  return html.replace(
    /(\s(?:href|src|action|poster|background)\s*=\s*["'])([^"']*)(["'])/gi,
    (_, prefix: string, value: string, suffix: string) => `${prefix}${sanitizeUrl(value)}${suffix}`,
  );
}

function sanitizeCssUrls(css: string): string {
  return css.replace(/url\(\s*(["']?)([^"')]*)\1\s*\)/gi, (whole, _quote, value: string) => {
    if (!value) return whole;
    if (imageDataUrlOrSafe(value)) return whole;
    if (/^(['"]?)https:\/\//i.test(value || '')) return whole;
    return 'none';
  });
}

function imageDataUrlOrSafe(value: string): boolean {
  return IMAGE_DATA_URL.test(value.trim()) || /^https:\/\//i.test(value.trim());
}

function sanitizeCss(css: string): string {
  let out = sanitizeCssUrls(css);
  out = out.replace(/(@import\s+url\([^)]*\))/gi, '');
  return out;
}

function sanitizeScript(script: string): string {
  let out = script;
  out = out.replace(/\beval\s*\(/gi, 'void 0 /* blocked */');
  out = out.replace(/\bnew\s+Function\s*\(/gi, 'void 0 /* blocked */');
  out = out.replace(/\bdocument\.write\s*\(/gi, 'void 0 /* blocked */');
  out = out.replace(/fetch\s*\(\s*["'](?:javascript|vbscript):/gi, 'void 0 /* blocked by policy */');
  return out;
}

function sanitizeHtml(html: string): string {
  let out = sanitizeAttributeUrls(html);
  out = out.replace(/<base\b[^>]*>/gi, '');
  out = out.replace(/<meta\b[^>]*http-equiv\s*=\s*["']?refresh["']?[^>]*>/gi, '');
  out = out.replace(/<iframe\b[^>]*>/gi, tag => {
    const src = /src\s*=\s*["']([^"']*)["']/i.exec(tag)?.[1] ?? '';
    if (!/^https:\/\//i.test(src)) return '';
    const cleaned = sanitizeAttributeUrls(tag);
    if (/\bsandbox\s*=/.test(cleaned)) return cleaned;
    return cleaned.replace(/\/?\s*>$/, ' sandbox="allow-scripts allow-popups allow-forms allow-modals">');
  });
  out = out.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, block => {
    if (/\bsrc\s*=/i.test(block) && !/\btype\s*=\s*["']application\/json["']/i.test(block)) return '';
    return block;
  });
  out = out.replace(/<script\b[^>]*\bsrc\s*=[^>]*\/?>/gi, '');
  out = out.replace(/\bstyle\s*=\s*(["'])[^"']*url\(\s*["']?(?:javascript|vbscript):[^"')]+["']?\)[^"']*\1/gi, match => match.replace(/url\(\s*["']?(.+?)["']?\s*\)/gi, 'none'));
  out = out.replace(/<html\b(?!\s[^>]*\blang\s*=\s*(["'])[^"']*\1)/i, '<html lang="pt-BR"');
  return normalizeDocHead(out);
}

function normalizeDocHead(html: string): string {
  const existingTitle = (/<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? '').trim();
  let out = html
    .replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta\b[^>]*\bcharset\s*=[^>]*>/gi, '')
    .replace(/<meta\b[^>]*\bname\s*=\s*["']?viewport["']?[^>]*>/gi, '');

  const canonical = (inner: string) => {
    const extras = inner.replace(/^\s+/, '').replace(/\s+$/, '');
    return `${extras ? `${extras}\n` : ''}<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>${existingTitle}</title>`;
  };

  if (!/<html[\s>]/i.test(out)) {
    return `<!doctype html>\n<html lang="pt-BR">\n<head>\n${canonical('')}</head>\n<body>\n${out}\n</body>\n</html>`;
  }
  if (/<head\b[^>]*>[\s\S]*?<\/head>/i.test(out)) {
    return out.replace(/<head\b[^>]*>[\s\S]*?<\/head>/i, head => {
      const opening = /<head\b[^>]*>/i.exec(head)![0];
      const inner = head.replace(/^<head\b[^>]*>/i, '').replace(/<\/head>$/i, '');
      return `${opening}\n${canonical(inner)}</head>`;
    });
  }
  return out.replace(/<html\b[^>]*>/i, match => `${match}\n<head>\n${canonical('')}</head>`);
}

export function sanitizeFiles(files: ArtefactFiles): SanitizeResult {
  const warnings: string[] = [];
  const html = sanitizeHtml(files['index.html']);
  const css = sanitizeCss(files['styles.css'] || '');
  const script = sanitizeScript(files['script.js'] || '');
  if (/<style/i.test(html) && files['styles.css']) warnings.push('css_inline_no_html');
  if (script && !/<script/i.test(files['index.html'])) warnings.push('script_sem_tag');
  return { files: { 'index.html': html, 'styles.css': css, 'script.js': script }, warnings };
}

export const artefactSize = (files: ArtefactFiles) => files['index.html'].length + (files['styles.css']?.length ?? 0) + (files['script.js']?.length ?? 0);