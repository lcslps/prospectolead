import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Select } from './ui/Select';
import { useState } from 'react';
import { Plus, Trash2, Upload } from 'lucide-react';
import type { SiteContent, SiteDocument, SiteSection } from '../types/website';
import { emptyItem } from '../types/website';

export function TextField({ label, value, onChange, multiline, field }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean; field?: string }) {
  return <label className="studio-field"><span>{label}</span>{multiline ? <Textarea unstyled data-editor-field={field} value={value} onChange={e => onChange(e.target.value)} rows={3} /> : <Input unstyled data-editor-field={field} value={value} onChange={e => onChange(e.target.value)} />}</label>;
}
function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="studio-color"><span>{label}</span><Input unstyled type="color" value={value} onChange={e => onChange(e.target.value)} /><code>{value}</code></label>; }
function ImageField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [error, setError] = useState('');
  return <div className="studio-image-field">
    {value && <img src={value} alt="Imagem selecionada" />}
    <TextField label="URL da imagem (HTTPS)" value={value.startsWith('data:') ? '' : value} onChange={onChange} field="image" />
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
  const businessLabels: Record<keyof SiteDocument['business'], string> = { name: 'Nome da empresa', category: 'Categoria', city: 'Cidade / estado', address: 'Endereço', phone: 'Telefone', whatsapp: 'Link do WhatsApp', hours: 'Horários', rating: 'Nota Google', reviewCount: 'Quantidade de avaliações', mapUrl: 'Link do Google Maps' };
  return <>
    <div className="studio-panel-block"><h3>Clima do site</h3><label className="studio-field"><span>Kit da marca</span><Select onChange={e => {
      const palettes = { vibrante: ['#164e63', '#06b6d4'], elegante: ['#292524', '#b45309'], natural: ['#14532d', '#16a34a'], classico: ['#1e3a8a', '#2563eb'] };
      const [primary, accent] = palettes[e.target.value as keyof typeof palettes]; onChange({ ...doc, theme: { ...doc.theme, primary, accent }, sections: doc.sections.map(s => ['hero', 'cta'].includes(s.type) ? { ...s, settings: { ...s.settings, background: primary } } : s) });
    }} defaultValue=""><option disabled value="">Personalizado</option><option value="vibrante">Vibrante</option><option value="elegante">Elegante</option><option value="natural">Natural</option><option value="classico">Clássico</option></Select></label>
      {(['primary', 'accent', 'background', 'text'] as const).map((key, i) => <ColorField key={key} label={['Cor principal', 'Destaque / botões', 'Fundo', 'Texto'][i]} value={doc.theme[key]} onChange={value => onChange({ ...doc, theme: { ...doc.theme, [key]: value }, sections: doc.sections.map(s => key === 'primary' && ['hero', 'cta'].includes(s.type) ? { ...s, settings: { ...s.settings, background: value } } : key === 'background' && s.settings.background === doc.theme.background ? { ...s, settings: { ...s.settings, background: value } } : key === 'text' && s.settings.color === doc.theme.text ? { ...s, settings: { ...s.settings, color: value } } : s) })} />)}
      <label className="studio-field"><span>Tipografia</span><Select value={doc.theme.font} onChange={e => onChange({ ...doc, theme: { ...doc.theme, font: e.target.value as 'sans' | 'serif' } })}><option value="sans">Moderna</option><option value="serif">Clássica</option></Select></label>
      <label className="studio-field"><span>Arredondamento dos botões · {doc.theme.radius}px</span><Input unstyled type="range" min="0" max="60" value={doc.theme.radius} onChange={e => onChange({ ...doc, theme: { ...doc.theme, radius: Number(e.target.value) } })} /></label>
    </div>
    <div className="studio-panel-block"><h3>Ficha do estabelecimento</h3>{Object.entries(businessLabels).map(([key, label]) => <TextField key={key} label={label} value={doc.business[key as keyof typeof doc.business]} multiline={key === 'hours'} onChange={value => updateBusiness(key, value)} />)}</div>
  </>;
}
export function SectionFields({ section: s, onChange }: { section: SiteSection; onChange: (s: SiteSection) => void }) {
  const c = s.content;
  const content = (patch: Partial<SiteContent>) => onChange({ ...s, content: { ...c, ...patch } });
  return <>
    <div className="studio-panel-block"><h3>Conteúdo</h3>{(['eyebrow', 'title', 'subtitle', 'text'] as const).map((key, i) => <TextField key={key} field={key} label={['Linha pequena', 'Título', 'Subtítulo', 'Texto / descrição'][i]} value={c[key]} multiline={key === 'text' || key === 'subtitle'} onChange={value => content({ [key]: value })} />)}</div>
    <div className="studio-panel-block"><h3>Imagem</h3><ImageField value={c.image} onChange={image => content({ image })} /><TextField label="Descrição da imagem" value={c.imageAlt} onChange={imageAlt => content({ imageAlt })} /></div>
    <div className="studio-panel-block"><h3>Botões</h3>{(['primaryButton', 'secondaryButton'] as const).map((key, i) => <div key={key} className="studio-subgroup"><TextField label={`Texto do botão ${i === 0 ? 'principal' : 'secundário'}`} value={c[key].label} onChange={label => content({ [key]: { ...c[key], label } })} /><TextField label="Link (https://, tel:, mailto: ou #seção)" value={c[key].href} onChange={href => content({ [key]: { ...c[key], href } })} /><label className="studio-check"><Input unstyled type="checkbox" checked={c[key].newTab} onChange={e => content({ [key]: { ...c[key], newTab: e.target.checked } })} />Abrir em nova aba</label></div>)}</div>
    <div className="studio-panel-block"><h3>{s.type === 'faq' ? 'Perguntas e respostas' : 'Itens da seção'}</h3>{c.items.map((item, i) => <div key={i} className="studio-item-editor"><div className="studio-item-heading"><strong>Item {i + 1}</strong><Button variant="unstyled" aria-label="Excluir item" onClick={() => content({ items: c.items.filter((_, index) => i !== index) })}><Trash2 size={14} /></Button></div>{(['title', 'text', 'price', 'href', 'imageAlt'] as const).map((key, n) => <TextField key={key} label={['Título / nome / pergunta', 'Descrição / resposta', 'Preço / horário', 'Link', 'Descrição da imagem'][n]} value={item[key]} multiline={key === 'text'} onChange={value => content({ items: c.items.map((v, index) => index === i ? { ...v, [key]: value } : v) })} />)}<ImageField value={item.image} onChange={image => content({ items: c.items.map((v, index) => index === i ? { ...v, image } : v) })} /></div>)}<Button variant="unstyled" className="studio-outline" disabled={c.items.length >= 60} onClick={() => content({ items: [...c.items, emptyItem()] })}><Plus size={14} />Adicionar item</Button></div>
    <div className="studio-panel-block"><h3>Estilo da seção</h3><ColorField label="Fundo" value={s.settings.background} onChange={background => onChange({ ...s, settings: { ...s.settings, background } })} /><ColorField label="Cor do texto" value={s.settings.color} onChange={color => onChange({ ...s, settings: { ...s.settings, color } })} /><label className="studio-field"><span>Alinhamento</span><Select value={s.settings.align} onChange={e => onChange({ ...s, settings: { ...s.settings, align: e.target.value as typeof s.settings.align } })}><option value="left">Esquerda</option><option value="center">Centro</option><option value="right">Direita</option></Select></label>{(['padding', 'radius', 'overlay'] as const).map((key, i) => <label className="studio-field" key={key}><span>{['Espaçamento', 'Bordas das imagens e cards', 'Escurecer imagem de capa'][i]} · {s.settings[key]}</span><Input unstyled type="range" min="0" max={key === 'padding' ? 180 : key === 'radius' ? 80 : 0.9} step={key === 'overlay' ? 0.05 : 1} value={s.settings[key]} onChange={e => onChange({ ...s, settings: { ...s.settings, [key]: Number(e.target.value) } })} /></label>)}</div>
  </>;
}
