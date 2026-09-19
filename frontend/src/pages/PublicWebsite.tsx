import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getData } from '../services/api';
import type { StoredSite } from '../types/website';
import { WebsiteFrame } from '../components/WebsiteFrame';

export function PublicWebsitePage() {
  const { id } = useParams(); const [site, setSite] = useState<StoredSite | null>(null); const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    getData<StoredSite>(`/websites/public/${id}`).then(d => {
      if (!active) return; setSite(d);
      document.title = d.artefact.seo.title || d.business.name;
      const meta = document.querySelector('meta[name="description"]') ?? document.createElement('meta');
      meta.setAttribute('name', 'description'); meta.setAttribute('content', d.artefact.seo.description || '');
      if (!meta.parentNode) document.head.appendChild(meta);
    }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [id]);
  if (!site) return <div style={{ padding: 60, textAlign: 'center', fontFamily: 'Arial, sans-serif', color: '#6b7280' }}>{error || 'Carregando site...'}</div>;
  return <div style={{ height: '100dvh', display: 'flex', background: '#fff' }}><WebsiteFrame artefact={site.artefact} title={site.business.name} /></div>;
}