import { useMemo, type RefObject } from 'react';
import type { SiteArtefact } from '../types/website';
import { buildSiteDoc } from '../lib/siteHtml';

export function WebsiteFrame({ artefact, interactive = true, editable = false, title = 'Prévia do site', frameRef }: { artefact: SiteArtefact | null; interactive?: boolean; editable?: boolean; title?: string; frameRef?: RefObject<HTMLIFrameElement | null> }) {
  const srcDoc = useMemo(() => (artefact ? buildSiteDoc(artefact, { interactive, editable }) : undefined), [artefact, interactive, editable]);
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
        ref={frameRef}
        title={title}
        className="studio-frame"
        srcDoc={srcDoc}
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms"
        style={{ width: '100%', height: '100%', border: 0, background: '#fff', boxShadow: '0 2px 14px rgba(17,24,39,.12)', borderRadius: 4, display: 'block' }}
      />
    </div>
  );
}