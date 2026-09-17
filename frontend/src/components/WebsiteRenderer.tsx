import { useState, type CSSProperties, type MouseEvent } from 'react';
import type { SiteButton, SiteDocument, SiteSection } from '../types/website';
import './website.css';

export const safeLink = (v: string) => /^(https?:\/\/|tel:|mailto:|#[\w-])/i.test(v) ? v : undefined;
export const safeImage = (v: string) => /^https:\/\//i.test(v) || /^data:image\/(png|jpeg|webp);base64,/i.test(v) ? v : undefined;
function CTA({ button, secondary = false }: { button: SiteButton; secondary?: boolean }) {
  if (!button.label || !safeLink(button.href)) return null;
  return <a className={`ws-button ${secondary ? 'ws-secondary' : ''}`} href={safeLink(button.href)} target={button.newTab ? '_blank' : undefined} rel="noopener noreferrer">{button.label}<span aria-hidden="true"> ↗</span></a>;
}
function ContactForm({ whatsapp }: { whatsapp: string }) {
  const [name, setName] = useState(''); const [message, setMessage] = useState('');
  return <form className="ws-form" onSubmit={e => { e.preventDefault(); if (/^https:\/\/wa.me\//.test(whatsapp)) window.open(`${whatsapp.split('?')[0]}?text=${encodeURIComponent(`Olá, sou ${name}. ${message}`)}`, '_blank', 'noopener,noreferrer'); }}>
    <label>Seu nome<input required value={name} onChange={e => setName(e.target.value)} maxLength={120} /></label>
    <label>Como podemos ajudar?<textarea required value={message} onChange={e => setMessage(e.target.value)} maxLength={2000} /></label>
    <button className="ws-button" disabled={!/^https:\/\/wa.me\//.test(whatsapp)}>Enviar pelo WhatsApp ↗</button>
    <small>A mensagem será aberta no WhatsApp para você enviar.</small>
  </form>;
}
export function WebsiteRenderer({ document: doc, selectedId, onSelect, interactive = true }: { document: SiteDocument; selectedId?: string | null; onSelect?: (id: string, field?: string) => void; interactive?: boolean }) {
  const b = doc.business;
  const handleClick = (event: MouseEvent, s: SiteSection) => {
    if (!interactive) { event.preventDefault(); event.stopPropagation(); onSelect?.(s.id, (event.target as HTMLElement).closest<HTMLElement>('[data-field]')?.dataset.field); }
  };
  return <main className="website-renderer" style={{ '--ws-primary': doc.theme.primary, '--ws-accent': doc.theme.accent, '--ws-radius': `${doc.theme.radius}px`, background: doc.theme.background, color: doc.theme.text, fontFamily: doc.theme.font === 'serif' ? 'Georgia, serif' : 'Arial, sans-serif' } as CSSProperties}>
    {doc.sections.filter(s => s.visible).map(s => {
      const c = s.content; const hero = s.type === 'hero';
      const bg = safeImage(c.image);
      return <section key={s.id} id={s.type === 'contact' ? 'contato' : s.id} data-section-id={s.id} className={`ws-section ws-${s.type} ${selectedId === s.id && !interactive ? 'ws-selected' : ''} ${!interactive ? 'ws-editable' : ''}`} onClick={e => handleClick(e, s)} style={{ backgroundColor: s.settings.background, color: s.settings.color, textAlign: s.settings.align, padding: `${s.settings.padding}px clamp(20px, 5vw, 72px)`, ...(hero && bg ? { backgroundImage: `linear-gradient(rgba(0,0,0,${s.settings.overlay}),rgba(0,0,0,${s.settings.overlay})), url("${bg.replaceAll('"', '%22')}")`, color: '#ffffff' } : {}) }}>
        <div className="ws-inner">
          {s.type === 'header' ? <div className="ws-navigation"><strong data-field="title">{c.title || b.name}</strong><nav>{doc.sections.filter(x => x.visible && !['header', 'hero', 'footer'].includes(x.type)).slice(0, 5).map(x => <a key={x.id} href={`#${x.type === 'contact' ? 'contato' : x.id}`}>{x.content.title}</a>)}</nav><CTA button={c.primaryButton} /></div> : <>
            {c.eyebrow && <div className="ws-eyebrow" data-field="eyebrow">{c.eyebrow}</div>}
            {hero ? <h1 data-field="title">{c.title}</h1> : <h2 data-field="title">{c.title}</h2>}
            {c.subtitle && <p className="ws-subtitle" data-field="subtitle">{c.subtitle}</p>}
            {c.text && <p className="ws-copy" data-field="text">{c.text}</p>}
            {!hero && bg && <img className="ws-main-image" data-field="image" src={bg} alt={c.imageAlt} loading="lazy" style={{ borderRadius: s.settings.radius }} />}
            {s.type === 'testimonials' && b.rating && <div className="ws-rating">★ {b.rating} no Google {b.reviewCount && <small>· {b.reviewCount} avaliações</small>}</div>}
            {s.type === 'hours' && b.hours && <p className="ws-copy">{b.hours}</p>}
            {['contact', 'map', 'footer'].includes(s.type) && <div className="ws-contact">{b.address && <p>{b.address}</p>}{b.city && <p>{b.city}</p>}{b.phone && <a href={`tel:${b.phone.replace(/[^+\d]/g, '')}`}>{b.phone}</a>}{b.hours && <p>{b.hours}</p>}{b.mapUrl && <a href={safeLink(b.mapUrl)} target="_blank" rel="noreferrer">Ver no Google Maps ↗</a>}</div>}
            {s.type === 'map' && b.address && <iframe className="ws-map" title={`Localização de ${b.name}`} loading="lazy" referrerPolicy="no-referrer" src={`https://maps.google.com/maps?q=${encodeURIComponent(`${b.address} ${b.city}`)}&output=embed`} />}
            {s.type === 'faq' ? <div className="ws-faq">{c.items.map((item, i) => <details key={i}><summary>{item.title}</summary><p>{item.text}</p></details>)}</div> : <div className={`ws-items ${s.type === 'menu' || s.type === 'prices' || s.type === 'hours' ? 'ws-list' : ''}`}>{c.items.map((item, i) => <article key={i} style={{ borderRadius: s.settings.radius }}>
              {safeImage(item.image) && <img src={safeImage(item.image)} alt={item.imageAlt} loading="lazy" />}
              <div><h3>{item.title}</h3>{item.text && <p>{item.text}</p>}{item.price && <strong>{item.price}</strong>}{safeLink(item.href) && <a href={safeLink(item.href)}>Saiba mais ↗</a>}</div>
            </article>)}</div>}
            {s.type === 'form' && <ContactForm whatsapp={b.whatsapp} />}
            <div className="ws-actions"><CTA button={c.primaryButton} /><CTA button={c.secondaryButton} secondary /></div>
          </>}
        </div>
      </section>;
    })}
  </main>;
}
