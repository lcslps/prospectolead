import { useCallback, useEffect, useMemo, useRef, type RefObject } from 'react';
import type { SiteArtefact } from '../types/website';
import { buildSiteDoc } from '../lib/siteHtml';

export interface WebsiteFrameRuntimeIssue {
  kind: 'image' | 'background';
  src: string;
  alt: string;
  reason: string;
}

export function WebsiteFrame({ artefact, interactive = true, editable = false, title = 'Prévia do site', frameRef, onRuntimeIssue }: {
  artefact: SiteArtefact | null;
  interactive?: boolean;
  editable?: boolean;
  title?: string;
  frameRef?: RefObject<HTMLIFrameElement | null>;
  onRuntimeIssue?: (issue: WebsiteFrameRuntimeIssue) => void;
}) {
  const ownFrameRef = useRef<HTMLIFrameElement | null>(null);
  const attachFrame = useCallback((node: HTMLIFrameElement | null) => {
    ownFrameRef.current = node;
    if (frameRef) frameRef.current = node;
  }, [frameRef]);
  const srcDoc = useMemo(() => (artefact ? buildSiteDoc(artefact, { interactive, editable }) : undefined), [artefact, interactive, editable]);

  useEffect(() => {
    /**
     * Um documento srcDoc usa origem opaca, então `origin` não pode ser a
     * verificação de confiança. Validamos o WindowProxy do iframe antes de
     * deixar mensagens do editor chegarem ao Studio.
     */
    const receiveFrameMessage = (event: MessageEvent) => {
      const data = event.data as { source?: unknown; type?: unknown; kind?: unknown; src?: unknown; alt?: unknown; reason?: unknown } | null;
      if (!data || (data.source !== 'site-edit' && data.source !== 'site-runtime')) return;
      const source = ownFrameRef.current?.contentWindow;
      if (!source || event.source !== source) {
        event.stopImmediatePropagation();
        return;
      }
      if (data.source !== 'site-runtime' || data.type !== 'image-fallback' || !onRuntimeIssue) return;
      const kind = data.kind === 'background' ? 'background' : 'image';
      onRuntimeIssue({
        kind,
        src: typeof data.src === 'string' ? data.src : '',
        alt: typeof data.alt === 'string' ? data.alt : '',
        reason: typeof data.reason === 'string' ? data.reason : 'load-error',
      });
    };
    window.addEventListener('message', receiveFrameMessage, true);
    return () => window.removeEventListener('message', receiveFrameMessage, true);
  }, [onRuntimeIssue]);

  if (!artefact || !srcDoc) {
    return (
      <div className="studio-frame-empty" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8792a2', background: '#fff', borderRadius: 6 }}>
        Nenhuma prévia disponível.
      </div>
    );
  }
  return (
    <div className="studio-frame-wrap" style={{ width: '100%', height: '100%' }}>
      <iframe
        ref={attachFrame}
        title={title}
        className="studio-frame"
        srcDoc={srcDoc}
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms"
        style={{ width: '100%', height: '100%', border: 0, background: '#fff', boxShadow: '0 2px 14px rgba(17,24,39,.12)', borderRadius: 4, display: 'block' }}
      />
    </div>
  );
}
