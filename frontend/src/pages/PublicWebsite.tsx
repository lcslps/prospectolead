import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getData } from '../services/api';
import type { SiteDocument } from '../types/website';
import { WebsiteRenderer } from '../components/WebsiteRenderer';

export function PublicWebsitePage() {
  const { id } = useParams(); const [doc, setDoc] = useState<SiteDocument | null>(null); const [error, setError] = useState('');
  useEffect(() => { let active = true; getData<SiteDocument>(`/websites/public/${id}`).then(d => { if (!active) return; setDoc(d); document.title = d.seo?.title || d.name; const meta = document.querySelector('meta[name="description"]') ?? document.createElement('meta'); meta.setAttribute('name', 'description'); meta.setAttribute('content', d.seo?.description || ''); if (!meta.parentNode) document.head.appendChild(meta); }).catch(e => { if (active) setError(e.message); }); return () => { active = false; }; }, [id]);
  if (!doc) return <div style={{ padding: 60, textAlign: 'center' }}>{error || 'Carregando site...'}</div>;
  return <WebsiteRenderer document={doc} />;
}
