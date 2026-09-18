import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Select } from './ui/Select';
import { useEffect, useState } from 'react';
import { getData, resolveSiteImage } from '../services/api';
import { Plus, Trash2, Upload } from 'lucide-react';
import type { SiteContent, SiteDocument, SitePhoto, SiteSection } from '../types/website';
import { emptyItem } from '../types/website';

export function TextField({ label, value, onChange, multiline, field }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean; field?: string }) {
  return <label className="studio-field"><span>{label}</span>{multiline ? <Textarea unstyled data-editor-field={field} value={value} onChange={e => onChange(e.target.value)} rows={3} /> : <Input unstyled data-editor-field={field} value={value} onChange={e => onChange(e.target.value)} />}</label>;
}
function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="studio-color"><span>{label}</span><Input unstyled type="color" value={value} onChange={e => onChange(e.target.value)} /><code>{value}</code></label>; }
function GooglePhotosAction({ document: doc, onChange }: { document: SiteDocument; onChange: (doc: SiteDocument) => void }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  if (!doc.business.googlePlaceId) return null;
  const applyPhotos = async () => {
    setLoading(true); setMessage('');
    try {
      const { photos } = await getData<{ photos: SitePhoto[] }>(`/websites/place-photos/${encodeURIComponent(doc.business.googlePlaceId!)}`);
      if (!photos.length) { setMessage('A API Places não disponibilizou fotos para este local. O Google Maps pode mostrar imagens que a API não libera para este projeto.'); return; }
      const apply = (content: SiteContent, photo: SitePhoto) => ({ ...content, image: photo.url, imageAlt: photo.alt, imageCredit: photo.credit, imageCreditUrl: photo.creditUrl });
      const hero = photos[0]; const about = photos[1] ?? photos[0]; const galleryPhotos = photos.slice(2);
      let hasGallery = false;
      const sections = doc.sections.map(section => {
        if (section.type === 'hero') return { ...section, content: apply(section.content, hero) };
        if (section.type === 'about') return { ...section, content: apply(section.content, about) };
        if (section.type !== 'gallery') return section;
        hasGallery = true;
        let next = 0;
        const items = section.content.items.map(item => {
          if (next >= galleryPhotos.length) return { ...item, image: '', imageAlt: '', imageCredit: '', imageCreditUrl: '' };
          const photo = galleryPhotos[next++];
          return { ...item, image: photo.url, imageAlt: photo.alt, imageCredit: photo.credit, imageCreditUrl: photo.creditUrl };
        });
        for (const photo of galleryPhotos.slice(next)) items.push({ ...emptyItem(), image: photo.url, imageAlt: photo.alt, imageCredit: photo.credit, imageCreditUrl: photo.creditUrl });
        return { ...section, content: { ...section.content, items } };
      });
      if (!hasGallery && galleryPhotos.length) {
        const gallery = { id: crypto.randomUUID(), type: 'gallery' as const, visible: true, content: { ...emptyItem(), eyebrow: '', title: 'Fotos do estabelecimento', subtitle: '', primaryButton: { label: '', href: '', newTab: false }, secondaryButton: { label: '', href: '', newTab: false }, items: galleryPhotos.map(photo => ({ ...emptyItem(), image: photo.url, imageAlt: photo.alt, imageCredit: photo.credit, imageCreditUrl: photo.creditUrl })) }, settings: { background: '#ffffff', color: '#172033', align: 'center' as const, padding: 72, radius: 16, overlay: 0.45 } };
        const at = sections.findIndex(section => section.type === 'footer' || section.type === 'contact');
        sections.splice(at >= 0 ? at : sections.length, 0, gallery);
      }
      onChange({ ...doc, sections }); setMessage(`${photos.length} fotos reais do Google Maps aplicadas.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível buscar as fotos.'); }
    finally { setLoading(false); }
  };
  return <div className="studio-panel-block"><h3>Fotos reais da empresa</h3><p>Priorize as fotos publicadas para este local no Google Maps.</p><Button variant="unstyled" className="studio-outline" disabled={loading} onClick={() => void applyPhotos()}>{loading ? 'Buscando fotos do estabelecimento...' : 'Aplicar fotos do Google Maps'}</Button>{message && <p className="studio-photo-hint" role="status">{message}</p>}</div>;
}
function ImageField({ value, onChange, suggestion, googlePlaceId }: { value: string; onChange: (value: string, photo?: SitePhoto) => void; suggestion: string; googlePlaceId?: string }) {
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState<'stock' | 'maps'>('stock');
  const [query, setQuery] = useState(suggestion);
  const [photos, setPhotos] = useState<SitePhoto[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!open) return;
    let active = true;
    const url = source === 'maps' ? googlePlaceId ? `/websites/place-photos/${encodeURIComponent(googlePlaceId)}` : '' : query.trim().length >= 2 ? `/websites/photos?q=${encodeURIComponent(query.trim())}` : '';
    if (!url) { setPhotos([]); setLoading(false); return () => { active = false; }; }
    const timer = window.setTimeout(() => {
      setLoading(true); setError('');
      getData<{ photos: SitePhoto[] }>(url).then(data => { if (active) setPhotos(data.photos); }).catch((e: Error) => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    }, source === 'stock' ? 350 : 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [open, source, query, googlePlaceId]);
  return <div className="studio-image-field">
    {value && <img src={resolveSiteImage(value)} alt="Imagem selecionada" />}
    <TextField label="URL da imagem (HTTPS)" value={value.startsWith('data:') ? '' : value} onChange={onChange} field="image" />
    <Button variant="unstyled" className="studio-outline studio-image-search-trigger" aria-expanded={open} onClick={() => setOpen(v => !v)}>{open ? 'Fechar busca' : 'Buscar imagens relevantes'}</Button>
    {open && <div className="studio-photo-picker"><div className="studio-photo-sources"><Button variant="unstyled" className={source === 'stock' ? 'active' : ''} onClick={() => setSource('stock')}>Banco de imagens</Button><Button variant="unstyled" disabled={!googlePlaceId} className={source === 'maps' ? 'active' : ''} onClick={() => setSource('maps')}>Google Maps</Button></div>{source === 'stock' && <label className="studio-field"><span>O que deseja mostrar?</span><Input unstyled value={query} onChange={e => setQuery(e.target.value)} placeholder="Ex.: pizzas artesanais" /></label>}{source === 'maps' && <p className="studio-photo-hint">Fotos deste estabelecimento fornecidas pelo Google Maps.</p>}{error && <p className="studio-error" role="alert">{error}</p>}{loading ? <p className="studio-photo-hint">Buscando imagens...</p> : photos.length ? <div className="studio-photo-grid">{photos.map((photo, index) => <Button variant="unstyled" key={`${photo.url}-${index}`} className="studio-photo-option" onClick={() => { onChange(photo.url, photo); setOpen(false); }}><img src={photo.url.startsWith('google-place://') ? resolveSiteImage(photo.url) : photo.url} alt="" loading="lazy"/><span>{photo.provider} · {photo.credit}</span></Button>)}</div> : !error && <p className="studio-photo-hint">{source === 'stock' ? 'Sem resultados. Configure PEXELS_API_KEY ou PIXABAY_API_KEY no backend.' : googlePlaceId ? 'A API Places não disponibilizou fotos para este local. O Google Maps pode mostrar imagens que a API não libera para este projeto.' : 'Este site não está vinculado a um lugar do Google Maps.'}</p>}</div>}
    <label className="studio-upload"><Upload size={14} /> Enviar imagem<Input unstyled type="file" accept="image/png,image/jpeg,image/webp" onChange={e => {
      const file = e.target.files?.[0]; if (!file) return; e.target.value = '';
      if (file.size > 2 * 1024 * 1024 || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) { setError('Escolha JPG, PNG ou WebP de até 2 MB.'); return; }
      setError(''); const reader = new FileReader(); reader.onload = () => onChange(String(reader.result)); reader.onerror = () => setError('Não foi possível ler a imagem.'); reader.readAsDataURL(file);
    }} /></label>
    {value && <Button variant="unstyled" className="studio-text-button" onClick={() => onChange('')}>Remover imagem</Button>}{error && <p role="alert" className="studio-error">{error}</p>}
  </div>;
}
export function SiteFields({ document: doc, onChange }: { document: SiteDocument; onChange: (doc: SiteDocument) => void }) {
  const updateBusiness = (key: string, value: string) => {
    const previousName = doc.business.name, previousWhatsapp = doc.business.whatsapp;
    onChange({ ...doc, name: key === 'name' && doc.name === previousName ? value : doc.name, business: { ...doc.business, [key]: value }, sections: doc.sections.map(s => ({ ...s, content: { ...s.content,
      title: key === 'name' && s.content.title === previousName ? value : s.content.title,
      primaryButton: key === 'whatsapp' && s.content.primaryButton.href === previousWhatsapp ? { ...s.content.primaryButton, href: value } : s.content.primaryButton,
      secondaryButton: key === 'whatsapp' && previousWhatsapp && s.content.secondaryButton.href === previousWhatsapp ? { ...s.content.secondaryButton, href: value } : s.content.secondaryButton,
    } })) });
  };
  const businessLabels: Record<Exclude<keyof SiteDocument['business'], 'googlePlaceId'>, string> = { name: 'Nome da empresa', category: 'Categoria', city: 'Cidade / estado', address: 'Endereço', phone: 'Telefone', whatsapp: 'Link do WhatsApp', hours: 'Horários', rating: 'Nota Google', reviewCount: 'Quantidade de avaliações', mapUrl: 'Link do Google Maps' };
  return <>
    <GooglePhotosAction document={doc} onChange={onChange} />
    <div className="studio-panel-block"><h3>Clima do site</h3><label className="studio-field"><span>Kit da marca</span><Select onChange={e => {
      const palettes = { vibrante: ['#164e63', '#06b6d4'], elegante: ['#292524', '#b45309'], natural: ['#14532d', '#16a34a'], classico: ['#1e3a8a', '#2563eb'] };
      const [primary, accent] = palettes[e.target.value as keyof typeof palettes]; onChange({ ...doc, theme: { ...doc.theme, primary, accent }, sections: doc.sections.map(s => ['hero', 'cta'].includes(s.type) ? { ...s, settings: { ...s.settings, background: primary } } : s) });
    }} defaultValue=""><option disabled value="">Personalizado</option><option value="vibrante">Vibrante</option><option value="elegante">Elegante</option><option value="natural">Natural</option><option value="classico">Clássico</option></Select></label>
      {(['primary', 'accent', 'background', 'text'] as const).map((key, i) => <ColorField key={key} label={['Cor principal', 'Destaque / botões', 'Fundo', 'Texto'][i]} value={doc.theme[key]} onChange={value => onChange({ ...doc, theme: { ...doc.theme, [key]: value }, sections: doc.sections.map(s => key === 'primary' && ['hero', 'cta'].includes(s.type) ? { ...s, settings: { ...s.settings, background: value } } : key === 'background' && s.settings.background === doc.theme.background ? { ...s, settings: { ...s.settings, background: value } } : key === 'text' && s.settings.color === doc.theme.text ? { ...s, settings: { ...s.settings, color: value } } : s) })} />)}
      <label className="studio-field"><span>Tipografia</span><Select value={doc.theme.font} onChange={e => onChange({ ...doc, theme: { ...doc.theme, font: e.target.value as 'sans' | 'serif' } })}><option value="sans">Moderna</option><option value="serif">Clássica</option></Select></label>
      <label className="studio-field"><span>Arredondamento dos botões · {doc.theme.radius}px</span><Input unstyled type="range" min="0" max="60" value={doc.theme.radius} onChange={e => onChange({ ...doc, theme: { ...doc.theme, radius: Number(e.target.value) } })} /></label>
    </div>
    <div className="studio-panel-block"><h3>Ficha do estabelecimento</h3>{Object.entries(businessLabels).map(([key, label]) => <TextField key={key} label={label} value={(doc.business[key as keyof typeof doc.business] ?? '')} multiline={key === 'hours'} onChange={value => updateBusiness(key, value)} />)}</div>
  </>;
}
export function SectionFields({ section: s, document: doc, onChange }: { section: SiteSection; document: SiteDocument; onChange: (s: SiteSection) => void }) {
  const c = s.content;
  const content = (patch: Partial<SiteContent>) => onChange({ ...s, content: { ...c, ...patch } });
  return <>
    <div className="studio-panel-block"><h3>Conteúdo</h3>{(['eyebrow', 'title', 'subtitle', 'text'] as const).map((key, i) => <TextField key={key} field={key} label={['Linha pequena', 'Título', 'Subtítulo', 'Texto / descrição'][i]} value={c[key]} multiline={key === 'text' || key === 'subtitle'} onChange={value => content({ [key]: value })} />)}</div>
    <div className="studio-panel-block"><h3>Imagem</h3><ImageField value={c.image} suggestion={`${doc.business.category} ${c.title} ${c.subtitle} ${c.text} ${doc.business.city}`.trim()} googlePlaceId={doc.business.googlePlaceId} onChange={(image, photo) => content({ image, imageCredit: photo?.credit ?? '', imageCreditUrl: photo?.creditUrl ?? '' })} /><TextField label="Descrição da imagem" value={c.imageAlt} onChange={imageAlt => content({ imageAlt })} /></div>
    <div className="studio-panel-block"><h3>Botões</h3>{(['primaryButton', 'secondaryButton'] as const).map((key, i) => <div key={key} className="studio-subgroup"><TextField label={`Texto do botão ${i === 0 ? 'principal' : 'secundário'}`} value={c[key].label} onChange={label => content({ [key]: { ...c[key], label } })} /><TextField label="Link (https://, tel:, mailto: ou #seção)" value={c[key].href} onChange={href => content({ [key]: { ...c[key], href } })} /><label className="studio-check"><Input unstyled type="checkbox" checked={c[key].newTab} onChange={e => content({ [key]: { ...c[key], newTab: e.target.checked } })} />Abrir em nova aba</label></div>)}</div>
    <div className="studio-panel-block"><h3>{s.type === 'faq' ? 'Perguntas e respostas' : 'Itens da seção'}</h3>{c.items.map((item, i) => <div key={i} className="studio-item-editor"><div className="studio-item-heading"><strong>Item {i + 1}</strong><Button variant="unstyled" aria-label="Excluir item" onClick={() => content({ items: c.items.filter((_, index) => i !== index) })}><Trash2 size={14} /></Button></div>{(['title', 'text', 'price', 'href', 'imageAlt'] as const).map((key, n) => <TextField key={key} label={['Título / nome / pergunta', 'Descrição / resposta', 'Preço / horário', 'Link', 'Descrição da imagem'][n]} value={item[key]} multiline={key === 'text'} onChange={value => content({ items: c.items.map((v, index) => i === index ? { ...v, [key]: value } : v) })} />)}<ImageField value={item.image} suggestion={`${doc.business.category} ${item.title} ${c.title} ${doc.business.city}`.trim()} googlePlaceId={doc.business.googlePlaceId} onChange={(image, photo) => content({ items: c.items.map((v, index) => index === i ? { ...v, image, imageCredit: photo?.credit ?? '', imageCreditUrl: photo?.creditUrl ?? '' } : v) })} /></div>)}<Button variant="unstyled" className="studio-outline" disabled={c.items.length >= 60} onClick={() => content({ items: [...c.items, emptyItem()] })}><Plus size={14} />Adicionar item</Button></div>
    <div className="studio-panel-block"><h3>Estilo da seção</h3><ColorField label="Fundo" value={s.settings.background} onChange={background => onChange({ ...s, settings: { ...s.settings, background } })} /><ColorField label="Cor do texto" value={s.settings.color} onChange={color => onChange({ ...s, settings: { ...s.settings, color } })} /><label className="studio-field"><span>Alinhamento</span><Select value={s.settings.align} onChange={e => onChange({ ...s, settings: { ...s.settings, align: e.target.value as typeof s.settings.align } })}><option value="left">Esquerda</option><option value="center">Centro</option><option value="right">Direita</option></Select></label>{(['padding', 'radius', 'overlay'] as const).map((key, i) => <label className="studio-field" key={key}><span>{['Espaçamento', 'Bordas das imagens e cards', 'Escurecer imagem de capa'][i]} · {s.settings[key]}</span><Input unstyled type="range" min="0" max={key === 'padding' ? 180 : key === 'radius' ? 80 : 0.9} step={key === 'overlay' ? 0.05 : 1} value={s.settings[key]} onChange={e => onChange({ ...s, settings: { ...s.settings, [key]: Number(e.target.value) } })} /></label>)}</div>
  </>;
}
