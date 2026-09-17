import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { WebsiteRenderer } from './WebsiteRenderer';
import type { SiteDocument } from '../types/website';
import css from './website.css?inline';

export function WebsiteFrame({ document, width, selectedId, interactive, onSelect }: { document: SiteDocument; width: number; selectedId: string | null; interactive: boolean; onSelect: (id: string, field?: string) => void }) {
  const [body, setBody] = useState<HTMLElement | null>(null);
  useEffect(() => { if (selectedId && body) body.querySelector(`[data-section-id="${CSS.escape(selectedId)}"]`)?.scrollIntoView({ block: 'start', behavior: 'smooth' }); }, [selectedId, body]);
  return <iframe title="Prévia do site" className="studio-frame" style={{ width }} onLoad={e => setBody(e.currentTarget.contentDocument?.body ?? null)} srcDoc={`<!doctype html><html lang="pt-BR"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;padding:0}html{scroll-behavior:smooth}${css}</style></head><body></body></html>`}>
    {body && createPortal(<WebsiteRenderer document={document} selectedId={selectedId} interactive={interactive} onSelect={onSelect} />, body)}
  </iframe>;
}
