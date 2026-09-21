import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Copy, ExternalLink, Eye, Globe, Hand, ImagePlus, Loader2, MapPin, Monitor, MousePointer2, Phone, RefreshCw, Save, Search, Smartphone, Sparkles, Star, Tablet, X } from 'lucide-react';
import { getData, postData, putData } from '../services/api';
import { VERSION_SOURCE_LABELS, type SiteAsset, type Website, type WebsiteVersion } from '../types/website';
import { WebsiteFrame } from '../components/WebsiteFrame';
import { ThemeToggle } from '../components/Theme';
import './studio.css';

const KB = 1024;
const DEVICES = [['390', Smartphone, 'Celular'], ['768', Tablet, 'Tablet'], ['1200', Monitor, 'Desktop']] as const;
const GENERATION_STAGES: Array<[string, string]> = [
  ['PREPARE', 'Preparando os dados verificados do estabelecimento'],
  ['ASSET_DISCOVERY', 'Selecionando imagens e referências do negócio'],
  ['SITE_GENERATION', 'Criando a direção visual e o site'],
  ['VALIDATING', 'Validando estrutura, imagens e responsividade'],
];
const generationStageLabel = (stage?: string) => {
  if (stage === 'RETRY_WAIT') return 'Gemini indisponível: aguardando a próxima tentativa automática.';
  if (stage === 'FAILED') return 'A geração foi interrompida.';
  return GENERATION_STAGES.find(([key]) => key === stage)?.[1] || 'Aguardando a fila de geração.';
};

export function WebsiteStudioPage() {
  const { id } = useParams(); const navigate = useNavigate();
  const [site, setSite] = useState<Website | null>(null);
  const [versions, setVersions] = useState<WebsiteVersion[]>([]);
  const [error, setError] = useState('');
  const [width, setWidth] = useState(1200); const [zoom, setZoom] = useState(0.8); const [mode, setMode] = useState<'edit' | 'interact'>('edit');
  const [dirty, setDirty] = useState(false); const [saving, setSaving] = useState(false); const [savedNotice, setSavedNotice] = useState(false);
  const [imagePicker, setImagePicker] = useState<{ src: string; alt: string } | null>(null);
  const [photoQuery, setPhotoQuery] = useState(''); const [photos, setPhotos] = useState<SiteAsset[]>([]); const [photoBusy, setPhotoBusy] = useState(false); const [customImage, setCustomImage] = useState('');
  const [aiOpen, setAiOpen] = useState(false); const [aiMode, setAiMode] = useState<'edit' | 'redesign'>('edit'); const [aiInstruction, setAiInstruction] = useState(''); const [aiBusy, setAiBusy] = useState(false); const [aiError, setAiError] = useState(''); const [aiDone, setAiDone] = useState(false);
  const [publishBusy, setPublishBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const measure = () => setViewport({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const load = useCallback(async () => {
    const s = await getData<Website>(`/websites/${id}`);
    if (s.generationStatus === 'completed') setVersions(await getData<WebsiteVersion[]>(`/websites/${id}/versions`).catch(() => []));
    setSite(s);
  }, [id]);
  useEffect(() => {
    let active = true;
    load().catch(e => { if (active) setError(e instanceof Error ? e.message : 'Erro ao carregar o site.'); });
    return () => { active = false; };
  }, [load]);
  useEffect(() => {
    if (!site || !['pending', 'generating'].includes(site.generationStatus)) return;
    const timer = setInterval(() => { void load().catch(() => {}); }, 4000);
    return () => clearInterval(timer);
  }, [site?.generationStatus, load]);
  useEffect(() => { if (aiInstruction.trim()) setAiDone(false); }, [aiInstruction]);
  useEffect(() => {
    if (!aiOpen && !imagePicker) return;
    const dismiss = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setImagePicker(null);
      setAiOpen(false);
    };
    window.addEventListener('keydown', dismiss);
    return () => window.removeEventListener('keydown', dismiss);
  }, [aiOpen, imagePicker]);

  const saveSerialized = useCallback(async (payload: { html: string; css: string; js: string }) => {
    setSaving(true);
    try {
      const updated = await putData<Website>(`/websites/${id}/content`, { files: { 'index.html': payload.html, 'styles.css': payload.css, 'script.js': payload.js } });
      setSite(updated); setDirty(false); setSavedNotice(true);
      setVersions(await getData<WebsiteVersion[]>(`/websites/${id}/versions`).catch(() => []));
      setTimeout(() => setSavedNotice(false), 2600);
    } catch (e) { setError(e instanceof Error ? e.message : 'Erro ao salvar as alterações.'); }
    finally { setSaving(false); }
  }, [id]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data as { source?: string; type?: string; html?: string; css?: string; js?: string; src?: string; alt?: string } | null;
      if (!data || data.source !== 'site-edit') return;
      if (data.type === 'dirty') { setDirty(true); setSavedNotice(false); }
      else if (data.type === 'select-image') { setImagePicker({ src: data.src || '', alt: data.alt || '' }); setCustomImage(''); setPhotos([]); setPhotoQuery(site?.business?.category || site?.name || ''); }
      else if (data.type === 'serialized' && typeof data.html === 'string') void saveSerialized({ html: data.html, css: data.css || '', js: data.js || '' });
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [saveSerialized, site?.business?.category, site?.name]);

  useEffect(() => {
    if (!imagePicker) return;
    const q = (photoQuery || site?.name || '').trim();
    if (q.length < 2) return;
    let active = true; setPhotoBusy(true);
    getData<{ photos: SiteAsset[] }>('/websites/photos', { q })
      .then(result => { if (active) setPhotos(result.photos); })
      .catch(() => { if (active) setPhotos([]); })
      .finally(() => { if (active) setPhotoBusy(false); });
    return () => { active = false; };
  }, [imagePicker]);

  const generateAgain = async () => {
    setError(''); setSite(s => s ? { ...s, generationStatus: 'generating', generationError: null } : s);
    try { await postData('/websites/generate', { crmLeadId: site?.crmLeadId }); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Erro ao gerar.'); }
  };

  const askAi = async () => {
    if (!aiInstruction.trim()) { setAiError('Descreva o que deseja mudar no site.'); return; }
    setAiBusy(true); setAiError(''); setAiDone(false);
    try {
      const body = aiMode === 'edit' ? { instruction: aiInstruction.trim() } : { instruction: aiInstruction.trim() };
      const result = await postData<Website>(`/websites/${id}/${aiMode === 'edit' ? 'rewrite' : 'regenerate'}`, body);
      setSite(result); setVersions(await getData<WebsiteVersion[]>(`/websites/${id}/versions`).catch(() => [])); setAiDone(true);
    } catch (e) { setAiError(e instanceof Error ? e.message : 'Erro ao aplicar a alteração.'); }
    finally { setAiBusy(false); }
  };

  const publish = async () => {
    setPublishBusy(true); setError('');
    try { setSite(await postData<Website>(`/websites/${id}/publish`, {})); }
    catch (e) { setError(e instanceof Error ? e.message : 'Erro ao publicar.'); }
    finally { setPublishBusy(false); }
  };
  const unpublish = async () => {
    setPublishBusy(true); setError('');
    try { setSite(await postData<Website>(`/websites/${id}/unpublish`, {})); }
    catch (e) { setError(e instanceof Error ? e.message : 'Erro ao despublicar.'); }
    finally { setPublishBusy(false); }
  };
  const restore = async (version: number) => {
    setError('');
    try { setSite(await postData<Website>(`/websites/${id}/restore`, { version })); setVersions(await getData<WebsiteVersion[]>(`/websites/${id}/versions`).catch(() => [])); }
    catch (e) { setError(e instanceof Error ? e.message : 'Erro ao restaurar a versão.'); }
  };
  const copyUrl = async () => {
    try { await navigator.clipboard.writeText(`${window.location.origin}/s/${id}`); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* clipboard indisponível */ }
  };
  const requestSave = () => {
    setSaving(true); setSavedNotice(false);
    frameRef.current?.contentWindow?.postMessage({ source: 'site-editor', type: 'serialize' }, '*');
  };
  const changeMode = (next: 'edit' | 'interact') => {
    if (next === mode) return;
    if (dirty && !window.confirm('Você tem alterações não salvas. Descartar e continuar?')) return;
    setDirty(false); setSavedNotice(false); setMode(next);
  };
  const applyImage = (url: string, alt?: string) => {
    frameRef.current?.contentWindow?.postMessage({ source: 'site-editor', type: 'set-image', src: url, alt: alt ?? imagePicker?.alt ?? '' }, '*');
    setDirty(true); setImagePicker(null);
  };
  const searchPhotos = async () => {
    const q = photoQuery.trim();
    if (q.length < 2) return;
    setPhotoBusy(true);
    try { setPhotos((await getData<{ photos: SiteAsset[] }>('/websites/photos', { q })).photos); }
    catch { setPhotos([]); }
    finally { setPhotoBusy(false); }
  };

  if (!site) {
    return <div className="studio studio-loading">{error ? <><p role="alert">{error}</p><Button variant="unstyled" onClick={() => navigate('/sites')}>Voltar aos projetos</Button></> : <><Loader2 className="animate-spin" />Carregando site...</>}</div>;
  }
  if (site.legacy) {
    return <div className="studio studio-loading"><p role="alert">Este site usa o editor antigo, que foi substituído pela criação de sites com IA. Crie um novo site para este estabelecimento.</p><Button variant="unstyled" onClick={() => navigate('/sites')}>Voltar aos projetos</Button></div>;
  }

  const doc = site.currentDocument;
  const plan = doc?.designPlan;
  const hasPlan = Boolean(plan && (plan.creativeDirection || plan.businessInsight || plan.primaryAction || plan.variationNote || plan.pageFlow.length || plan.designSystem?.palette?.primary));
  const PALETTE_KEYS = [['primary', 'Primária'], ['secondary', 'Secundária'], ['accent', 'Destaque'], ['background', 'Fundo'], ['surface', 'Superfície']] as const;
  const designPlan = doc?.designPlan && hasPlan ? doc.designPlan : undefined;
  const busy = publishBusy || aiBusy;
  const publishedUrl = `${window.location.origin}/s/${id}`;
  const published = site.status === 'PUBLISHED' && Boolean(site.publishedAt);
  const generationLabel = generationStageLabel(site.generationStage);
  const sizeKb = doc ? Math.round(doc.meta.sizeBytes / KB) : 0;
  const facts = doc?.business;

  const isDesktop = width >= 1200;
  const availW = viewport.w > 0 ? viewport.w : 1200;
  const availH = viewport.h > 0 ? viewport.h : 800;
  const stageLayout = isDesktop
    ? { w: Math.round(availW / zoom), h: Math.round(availH / zoom) }
    : { w: width, h: width >= 1024 ? availH : Math.round(width * (width >= 768 ? 1.4 : 2.1)) };
  const frameVisual = isDesktop
    ? { w: availW, h: availH }
    : { w: Math.round(stageLayout.w * zoom), h: Math.round(stageLayout.h * zoom) };

  return <div className="studio">
    <header className="studio-toolbar">
      <ThemeToggle />
      <Button variant="unstyled" title="Voltar aos meus projetos" onClick={() => navigate('/sites')}><ArrowLeft size={17} /></Button>
      <span className="studio-project-name" title={site.name}>{site.name}</span>
      <div className="studio-toolbar-divider" />
      <div className="studio-device-buttons">{DEVICES.map(([w, Icon, label]) => <Button variant="unstyled" key={w} className={width === Number(w) ? 'active' : ''} title={label} aria-label={label} onClick={() => setWidth(Number(w))}><Icon size={17} /></Button>)}</div>
      <Select aria-label="Zoom" value={zoom} onChange={e => setZoom(Number(e.target.value))}>{[0.5, 0.65, 0.8, 1].map(z => <option key={z} value={z}>{Math.round(z * 100)}%</option>)}</Select>
      <span className="studio-toolbar-divider" />
      <Button variant="unstyled" className={mode === 'edit' ? 'active' : ''} onClick={() => changeMode('edit')}><MousePointer2 size={15} />Editar direto</Button>
      <Button variant="unstyled" className={mode === 'interact' ? 'active' : ''} onClick={() => changeMode('interact')}><Hand size={15} />Interagir</Button>
      {mode === 'edit' && dirty && <Button variant="unstyled" className="studio-publish" disabled={saving} onClick={requestSave}>{saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}{saving ? 'Salvando...' : 'Salvar alterações'}</Button>}
      {savedNotice && <span className="studio-success-inline" role="status"><Check size={13} />Alterações salvas</span>}
      <span className="studio-save-state">{published ? <><Check size={13} />Publicado (v{site.publishedVersion})</> : <span>Rascunho · v{site.revision}</span>}</span>
      <div className="studio-toolbar-divider" />
      <Button variant="unstyled" className="studio-outline" onClick={() => { setAiOpen(true); setAiMode('edit'); setAiDone(false); setAiError(''); }}><Sparkles size={15} />Pedir à IA</Button>
      {published ? <Button variant="unstyled" className="studio-outline" disabled={busy} onClick={() => void unpublish()}><Eye size={15} />Despublicar</Button>
        : <Button variant="unstyled" className="studio-publish" disabled={busy || site.generationStatus !== 'completed'} onClick={() => void publish()}>{publishBusy ? <Loader2 size={15} className="animate-spin" /> : <Globe size={15} />}Publicar</Button>}
      {published && <a className="studio-public-link" href={publishedUrl} target="_blank" rel="noreferrer">Abrir publicado <ExternalLink size={11} /></a>}
      {published && <Button variant="unstyled" className="studio-outline" title="Copiar link publicado" onClick={() => void copyUrl()}><Copy size={14} />{copied ? 'Link copiado' : 'Link'}</Button>}
    </header>
    {error && <div className="studio-alert" role="alert">{error}<Button variant="unstyled" onClick={() => setError('')} aria-label="Fechar aviso"><X size={15} /></Button></div>}
    {site.generationStatus !== 'completed' && <div className="studio-generating" role="status">
      {site.generationStatus === 'failed' ? <><p role="alert">{site.generationError || 'A geração falhou.'}</p><Button variant="unstyled" className="studio-publish" onClick={() => void generateAgain()}><RefreshCw size={15} />Gerar novamente</Button><Button variant="unstyled" onClick={() => navigate('/sites')}>Voltar</Button></>
        : <><Loader2 className="animate-spin" /><p><strong>{generationLabel}</strong></p><ul className="studio-generating-steps">{GENERATION_STAGES.map(([key, label]) => <li key={key} className={site.generationStage === key ? 'active' : ''}>{site.generationStage === key ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}{label}</li>)}</ul>{site.generationStage === 'RETRY_WAIT' && site.generationNextAttemptAt && <p className="studio-generating-note">Próxima tentativa: {new Date(site.generationNextAttemptAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.</p>}<p className="studio-generating-note">Esta tela consulta o estágio persistido pelo backend a cada poucos segundos.</p><Button variant="unstyled" onClick={() => navigate('/sites')}>Voltar</Button></>}
    </div>}
    <div className="studio-workspace">
      <aside className="studio-left">
        <div className="studio-panel-heading"><h2>O que a IA sabe</h2><p>Use fatos reais ao pedir alterações.</p></div>
        {facts && <div className="studio-facts">
          <p className="studio-fact-main"><strong>{facts.name}</strong><span>{[facts.category, facts.city].filter(Boolean).join(' · ')}</span></p>
          {facts.address && <p><MapPin size={12} />{facts.address}</p>}
          {facts.phone && <p><Phone size={12} />{facts.phone}</p>}
          {facts.whatsapp && <p><Phone size={12} />WhatsApp {(facts.whatsapp || '').replace(/^https?:\/\/wa\.me\//, '')}</p>}
          {facts.hours && <p className="studio-fact-block"><span>Horários</span>{facts.hours}</p>}
          {facts.rating && facts.reviewCount && <p><Star size={12} />{facts.rating}/5 · {facts.reviewCount} avaliações</p>}
          {facts.mapUrl && <a href={facts.mapUrl} target="_blank" rel="noreferrer">Ver no Google Maps <ExternalLink size={11} /></a>}
          <p className="studio-fact-block"><span>SEO</span>{doc?.artefact.seo.title}</p>
          <p className="studio-fact-meta">Código</p>
          <p className="studio-fact-block"><span>Tamanho</span>{sizeKb} KB · {doc?.artefact.format === 'html-standalone' ? 'HTML+CSS+JS' : doc?.artefact.format}</p>
        </div>}
        {designPlan && <><div className="studio-panel-heading"><h2>Decisões do agente de design</h2><p>Análise, direção e sistema escolhidos pela IA para este negócio.</p></div>
        <div className="studio-facts studio-plan">
          {designPlan.businessInsight && <p className="studio-fact-block"><span>Análise do negócio</span>{designPlan.businessInsight}</p>}
          {designPlan.targetAudience && <p className="studio-fact-block"><span>Público</span>{designPlan.targetAudience}</p>}
          {designPlan.creativeDirection && <p className="studio-fact-block"><span>Direção criativa</span>{designPlan.creativeDirection}</p>}
          {designPlan.designSystem?.palette?.primary && <p className="studio-fact-block"><span>Design system</span><span className="studio-plan-swatches">{PALETTE_KEYS.map(([key, label]) => { const color = designPlan.designSystem?.palette?.[key]; return color ? <i key={key} title={`${label} ${color}`} style={{ background: color }} /> : null; })}<em>{designPlan.designSystem?.typography?.family || ''}{designPlan.designSystem?.shape?.radius ? ` · raio ${designPlan.designSystem.shape.radius}` : ''}</em></span></p>}
          {designPlan.pageFlow.length > 0 && <p className="studio-fact-block"><span>Componentes</span><span className="studio-plan-flow">{designPlan.pageFlow.map(c => <i key={c}>{c}</i>)}</span></p>}
          {designPlan.primaryAction && <p className="studio-fact-block"><span>Ação principal</span>{designPlan.primaryAction}</p>}
          {designPlan.whatsappStrategy && <p className="studio-fact-block"><span>WhatsApp</span>{designPlan.whatsappStrategy}</p>}
          {designPlan.contentDecisions && <p className="studio-fact-block"><span>Adaptação de conteúdo</span>{designPlan.contentDecisions}</p>}
          {designPlan.variationNote && <p className="studio-fact-block"><span>Diferenciação</span>{designPlan.variationNote}</p>}
        </div></>}
        <div className="studio-panel-heading"><h2>Imagens e fontes usadas</h2><p>Priorizamos Google Maps e redes autorizadas; quando necessário, usamos imagens licenciadas compatíveis com o nicho.</p></div>
        <div className="studio-facts">{doc?.assets.map(asset => <p key={asset.id} className="studio-fact-block"><span className="studio-asset-label"><em>{asset.provider}</em>{asset.alt || asset.id}</span>{asset.credit !== asset.provider ? `${asset.credit} · ` : ''}{asset.creditUrl && <a href={asset.creditUrl} target="_blank" rel="noreferrer">fonte</a>}</p>)}</div>
        <div className="studio-panel-heading"><h2>Versões</h2><p>Cada geração e ajuste cria uma nova versão.</p></div>
        <div className="studio-versions">
          {versions.length === 0 && <p className="studio-fact-meta">Nenhuma versão salva ainda.</p>}
          {versions.map(v => <div key={v.version} className={`studio-version-row ${v.isCurrent ? 'current' : ''}`}>
            <span className="studio-version-no">v{v.version}</span>
            <span className="studio-version-info"><strong>{VERSION_SOURCE_LABELS[v.source] || v.source}</strong><small>{new Date(v.createdAt).toLocaleString('pt-BR')} · {Math.round(v.sizeBytes / KB)} KB{v.isCurrent ? ' · atual' : ''}{v.isPublished ? ' · publicada' : ''}</small></span>
            <Button variant="unstyled" className="studio-outline" disabled={v.isCurrent} onClick={() => void restore(v.version)}>Restaurar</Button>
          </div>)}
        </div>
      </aside>
      <div className="studio-center">
        <div className="studio-viewport-toolbar"><span className="studio-draft-label">{published ? `Publicado como v${site.publishedVersion} · ${site.revision} no rascunho` : `Rascunho v${site.revision}${published ? ' · publicação anterior disponível' : ''}`}</span>{mode === 'edit' && <span className="studio-edit-hint">Clique em um texto para editar, em uma imagem para trocar e use as setas para mover o bloco.</span>}</div>
        <div className="studio-canvas-scroll" ref={canvasRef}>
          <div className={isDesktop ? 'studio-canvas-size desktop' : 'studio-canvas-size device'} style={{ width: frameVisual.w, height: frameVisual.h }}>
            <div className="studio-stage" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', width: stageLayout.w, height: stageLayout.h }}><WebsiteFrame artefact={doc?.artefact ?? null} interactive={mode === 'interact'} editable={mode === 'edit'} frameRef={frameRef} /></div>
          </div>
        </div>
      </div>
      <aside className="studio-right">
        <div className="studio-panel-heading"><h2>Ajustes rápidos</h2><p>O que você pode fazer agora.</p></div>
        <div className="studio-tips">
          <Button variant="unstyled" className="studio-tip" onClick={() => { setAiOpen(true); setAiMode('edit'); setAiInstruction(''); setAiDone(false); setAiError(''); }}><Sparkles size={15} /><span><strong>Pedir à IA</strong><small>Peça mudanças específicas como "destaque o WhatsApp no topo".</small></span></Button>
          <Button variant="unstyled" className="studio-tip" onClick={() => { setAiOpen(true); setAiMode('redesign'); setAiInstruction('Nova direção de arte, mais moderna e elegante.'); setAiDone(false); setAiError(''); }}><RefreshCw size={15} /><span><strong>Nova direção de arte</strong><small>Recria o visual inteiro mantendo os fatos reais.</small></span></Button>
          <a className="studio-tip" href={publishedUrl} target="_blank" rel="noreferrer"><ExternalLink size={15} /><span><strong>Abrir site publicado</strong><small>Visualize o que seus clientes veem.</small></span></a>
          <Link className="studio-tip" to={`/leads/${site.crmLeadId}`}><ArrowLeft size={15} /><span><strong>Ficha do estabelecimento</strong><small>Acompanhe dados e status no CRM.</small></span></Link>
        </div>
        <div className="studio-panel-heading"><h2>Dicas</h2></div>
        <ul className="studio-facts studio-facts-list">
          <li>A IA nunca inventa fatos: só usa os dados verificados do estabelecimento.</li>
          <li>Peça uma coisa por vez para resultados melhores.</li>
          <li>No modo <strong>Editar direto</strong>, clique em um texto para alterá-lo, em uma imagem para trocá-la e use as setas para mover o bloco. Depois clique em <strong>Salvar alterações</strong>.</li>
          <li>Use <strong>Interagir</strong> para navegar pelos links e testar o site como um visitante.</li>
        </ul>
      </aside>
    </div>
    {aiOpen && <div className="studio-modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setAiOpen(false); }}>
      <div className="studio-ai-modal" role="dialog" aria-modal="true" aria-labelledby="ai-title">
        <div className="studio-modal-heading"><h2 id="ai-title"><Sparkles size={20} />Assistente do site</h2><Button variant="unstyled" disabled={aiBusy} aria-label="Fechar" onClick={() => setAiOpen(false)}><X size={19} /></Button></div>
        <label className="studio-field"><span>O que fazer?</span>
          <Select value={aiMode} disabled={aiBusy} onChange={e => { setAiMode(e.target.value as 'edit' | 'redesign'); setAiDone(false); }}>
            <option value="edit">Ajustar o site (mudanças pontuais)</option>
            <option value="redesign">Nova direção de arte (recriar do zero)</option>
          </Select>
        </label>
        <label className="studio-field"><span>{aiMode === 'edit' ? 'O que devo mudar?' : 'Como deve ser a nova direção? (opcional)'}</span>
          <textarea className="studio-instruction" rows={5} value={aiInstruction} disabled={aiBusy} onChange={e => setAiInstruction(e.target.value)} placeholder={aiMode === 'edit' ? 'Ex.: deixe o WhatsApp em destaque no cabeçalho e adicione um botão "Chamar agora" no topo…' : 'Ex.: visual mais elegante, com tons escuros e fotos em destaque…'} autoFocus />
        </label>
        <p className="studio-field-hint">{aiMode === 'edit' ? 'A alteração é aplicada ao código e salva automaticamente como uma nova versão. Você poderá restaurar a qualquer momento.' : 'Uma nova versão completa substituirá o visual atual (rascunho). As versões anteriores continuam no histórico.'}</p>
        {aiDone && <p className="studio-success" role="status"><Check size={14} />Alterações aplicadas e salvas como nova versão.</p>}
        {aiError && <p role="alert" className="studio-error">{aiError}</p>}
        <div className="studio-modal-actions">
          <Button variant="unstyled" className="studio-outline" disabled={aiBusy} onClick={() => setAiOpen(false)}>Cancelar</Button>
          <Button variant="unstyled" className="studio-publish" disabled={aiBusy || (aiMode === 'edit' && !aiInstruction.trim())} onClick={() => void askAi()}>{aiBusy ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}{aiBusy ? 'Editando com IA...' : 'Gerar e salvar versão'}</Button>
        </div>
      </div>
    </div>}
    {imagePicker && <div className="studio-modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setImagePicker(null); }}>
      <div className="studio-ai-modal" role="dialog" aria-modal="true" aria-labelledby="image-title">
        <div className="studio-modal-heading"><h2 id="image-title"><ImagePlus size={20} />Trocar imagem</h2><Button variant="unstyled" aria-label="Fechar" onClick={() => setImagePicker(null)}><X size={19} /></Button></div>
        {imagePicker.src && <img className="studio-image-current" src={imagePicker.src} alt="" />}
        <label className="studio-field"><span>Buscar imagens</span>
          <div className="studio-field-row">
            <Input placeholder="Ex.: fachada, prato, sobremesa" value={photoQuery} onChange={e => setPhotoQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void searchPhotos(); } }} />
            <Button variant="unstyled" className="studio-outline" disabled={photoBusy} onClick={() => void searchPhotos()}>{photoBusy ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}Buscar</Button>
          </div>
        </label>
        {photos.length > 0 && <div className="studio-photo-grid">{photos.map(photo => <Button variant="unstyled" key={photo.id + photo.url} className="studio-photo-option" title={photo.alt} onClick={() => applyImage(photo.url, photo.alt)}><img src={photo.url} alt={photo.alt} loading="lazy" /><span>{photo.alt || photo.provider}</span></Button>)}</div>}
        <label className="studio-field" style={{ marginTop: 12 }}><span>Ou cole a URL da imagem</span>
          <div className="studio-field-row">
            <Input placeholder="https://..." value={customImage} onChange={e => setCustomImage(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && /^https:\/\//i.test(customImage.trim())) { e.preventDefault(); applyImage(customImage.trim(), imagePicker.alt); } }} />
            <Button variant="unstyled" className="studio-publish" disabled={!/^https:\/\//i.test(customImage.trim())} onClick={() => applyImage(customImage.trim(), imagePicker.alt)}>Usar</Button>
          </div>
        </label>
      </div>
    </div>}
    <Button variant="unstyled" className="studio-ai-button" onClick={() => { setAiOpen(true); setAiError(''); setAiDone(false); }}><Sparkles size={17} />Pedir à IA</Button>
  </div>;
}
