import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, RefreshCw, Sparkles } from 'lucide-react';
import ApiKeyPanel from '../../components/ApiKeyPanel';
import BusinessForm from '../../components/BusinessForm';
import PreviewPanel from '../../components/PreviewPanel';
import { PageHeader } from '../../components/layout';
import { callGeminiTextWithFallback } from '../../lib/gemini';
import { callCloudflareImage } from '../../lib/cloudflare';
import { buildStoryboardPrompt, buildUserPrompt, parseModelOutput, STYLE_GUIDE, FALLBACK_IMAGE_SVG, validateGeneratedSite } from '../../lib/prompts';
import { getCrmLead, listCrmLeads, saveLeadSite } from '../../lib/leads';
import type { BusinessFormData, Lead, LogEntry, LogKind } from '../../types';
import { DEFAULT_SECTIONS } from '../../types';
import { Card, Field, inputClassName } from '../../components/layout';

const EMPTY_FORM: BusinessFormData = {
  name: '',
  niche: 'Imobiliária / imóveis de alto padrão',
  desc: '',
  perks: '',
  cta: '',
  phone: '',
  city: '',
  colors: '',
  sections: [...DEFAULT_SECTIONS],
};

// Monta os dados do formulário automaticamente a partir de um lead do CRM,
// para que nada precise ser digitado manualmente.
function formDataFromLead(lead: Lead): BusinessFormData {
  const perks: string[] = [];
  if (lead.rating !== null) perks.push(`Nota ${lead.rating.toFixed(1)}/5 no Google (${lead.reviewCount} avaliações)`);
  if (!lead.hasSite) perks.push('Atendimento local de confiança');

  return {
    name: lead.name,
    niche: lead.niche || EMPTY_FORM.niche,
    desc: `${lead.niche || 'Negócio local'} em ${lead.city}${lead.state ? ', ' + lead.state : ''}.`,
    perks: perks.join('\n'),
    cta: '',
    phone: lead.phone || '',
    city: lead.state ? `${lead.city}, ${lead.state}` : lead.city,
    colors: '',
    sections: [...DEFAULT_SECTIONS],
  };
}

interface CriarProps {
  backendUrl: string;
}

export default function Criar({ backendUrl }: CriarProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const leadId = searchParams.get('leadId');

  const [modelText, setModelText] = useState('gemini-3.8-flash');
  const [modelImage, setModelImage] = useState('@cf/black-forest-labs/flux-2-klein-4b');

  const [lead, setLead] = useState<Lead | null>(null);
  const [crmLeads, setCrmLeads] = useState<Lead[]>([]);
  const [leadSearch, setLeadSearch] = useState('');
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [formData, setFormData] = useState<BusinessFormData>(EMPTY_FORM);
  const [referenceUrl, setReferenceUrl] = useState('');
  const [storyboard, setStoryboard] = useState('');
  const [generating, setGenerating] = useState(false);
  const [status, setStatus] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [finalHtml, setFinalHtml] = useState('');
  const [savingToLead, setSavingToLead] = useState(false);
  const logId = useRef(0);

  useEffect(() => {
    setLoadingLeads(true);
    listCrmLeads(backendUrl)
      .then(({ leads }) => setCrmLeads(leads))
      .catch(() => setCrmLeads([]))
      .finally(() => setLoadingLeads(false));
  }, [backendUrl]);

  useEffect(() => {
    if (!leadId) {
      setLead(null);
      setFormData(EMPTY_FORM);
      setStoryboard('');
      return;
    }
    getCrmLead(backendUrl, leadId)
      .then((l) => {
        setLead(l);
        setFormData(formDataFromLead(l));
        setStoryboard('');
      })
      .catch(() => setLead(null));
  }, [leadId, backendUrl]);

  const filteredLeads = crmLeads.filter((item) => {
    const query = leadSearch.trim().toLowerCase();
    return !query || `${item.name} ${item.city} ${item.state} ${item.niche}`.toLowerCase().includes(query);
  });

  function handleLeadChange(id: string) {
    if (!id) {
      navigate('/criar');
      return;
    }
    navigate(`/criar?leadId=${encodeURIComponent(id)}`);
  }

  function log(text: string, kind: LogKind = 'muted') {
    logId.current += 1;
    setLogs((prev) => [...prev, { id: logId.current, text, kind }]);
  }

  function updateFormData(data: BusinessFormData) {
    setFormData(data);
    setStoryboard('');
  }

  function updateReferenceUrl(value: string) {
    setReferenceUrl(value);
    setStoryboard('');
  }

  async function handleCreateStoryboard() {
    if (!formData.name.trim()) {
      alert('Informe o nome da empresa.');
      return;
    }
    if (!backendUrl.trim()) {
      alert('Informe a URL do backend.');
      return;
    }

    setGenerating(true);
    setLogs([]);
    setFinalHtml('');
    try {
      setStatus('Criando storyboard e direção de arte...');
      log('▸ Criando a direção de arte para sua aprovação...', 'go');
      const result = await callGeminiTextWithFallback(
        backendUrl,
        modelText,
        STYLE_GUIDE,
        buildStoryboardPrompt(formData, referenceUrl),
        log
      );
      setStoryboard(result.text.trim());
      setStatus('Storyboard pronto para revisão.');
      log(`✔ Storyboard criado com ${result.model}.`, 'ok');
    } catch (e) {
      log('✘ Erro ao criar storyboard: ' + (e as Error).message, 'err');
      setStatus('Não foi possível criar o storyboard.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleGenerate() {
    if (!formData.name.trim()) {
      alert('Informe o nome da empresa.');
      return;
    }
    if (!backendUrl.trim()) {
      alert('Informe a URL do backend.');
      return;
    }
    if (!storyboard) {
      alert('Gere e aprove o storyboard antes de criar o site.');
      return;
    }

    setGenerating(true);
    setLogs([]);
    setFinalHtml('');

    try {
      setStatus('Escrevendo o layout e o conteúdo do site...');
      log('▸ Pedindo ao Gemini para desenhar o site e o roteiro de imagens...', 'go');

      let generatedSite: ReturnType<typeof parseModelOutput> | null = null;
      let usedModel = modelText;
      const basePrompt = buildUserPrompt(formData, storyboard, referenceUrl);

      for (let attempt = 0; attempt < 2; attempt += 1) {
        const retryPrompt =
          attempt === 0
            ? basePrompt
            : `${basePrompt}\n\nCORREÇÃO OBRIGATÓRIA: a tentativa anterior foi reprovada por estar incompleta. Entregue novamente o documento HTML completo, com todas as cinco sections obrigatórias, quatro imagens obrigatórias, contato funcional e sem conteúdo oculto. Não resuma nem pare antes de </html>.`;
        const result = await callGeminiTextWithFallback(backendUrl, modelText, STYLE_GUIDE, retryPrompt, log);
        usedModel = result.model;
        const candidate = parseModelOutput(result.text);
        const validationIssues = validateGeneratedSite(candidate);

        if (validationIssues.length === 0) {
          generatedSite = candidate;
          break;
        }

        log(`✘ Rascunho reprovado: ${validationIssues.join('; ')}.`, 'err');
        if (attempt === 0) log('▸ Pedindo uma versão completa corrigida...', 'go');
      }

      if (!generatedSite) {
        throw new Error('O modelo não entregou um site completo após duas tentativas. Nenhum site foi salvo.');
      }

      const { images, html } = generatedSite;
      log(`✔ Layout e conteúdo completos gerados com ${usedModel}.`, 'ok');

      let html2 = html;
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        setStatus(`Gerando imagem ${i + 1}/${images.length}: ${img.id}...`);
        log(`▸ Gerando imagem "${img.id}" no Cloudflare FLUX...`, 'go');
        try {
          const isHero = /hero/i.test(img.id);
          const width = isHero ? 1536 : 1024;
          const height = 1024;
          const finalPrompt =
            img.prompt +
            (isHero
              ? ' Premium website hero advertising photography, subject placed to preserve deliberate negative space for large HTML typography, cinematic composition, crisp realistic materials, no text, no logo, no watermark.'
              : ' Premium commercial editorial photography for a high-end website, realistic materials and lighting, clean composition, no text, no logo, no watermark.');
          const dataUrl = await callCloudflareImage(backendUrl, modelImage, finalPrompt, width, height);
          const re = new RegExp(`\\[\\[IMG:${img.id}\\]\\]`, 'g');
          html2 = html2.replace(re, dataUrl);
          log(`✔ Imagem "${img.id}" pronta via Cloudflare.`, 'ok');
        } catch (e) {
          const msg = String((e as Error)?.message || e);
          log(`✘ Falha ao gerar "${img.id}": ${msg}`, 'err');
          if (/429|quota|neuron|limit|daily allocation|exceeded/i.test(msg)) {
            log('✘ Cota do Cloudflare atingida. Interrompendo as próximas imagens.', 'err');
            break;
          }
        }
      }

      html2 = html2.replace(/\[\[IMG:[a-zA-Z0-9_]+\]\]/g, FALLBACK_IMAGE_SVG);

      setStatus('Pronto!');
      log('✔ Site finalizado.', 'ok');
      setFinalHtml(html2);

      if (lead) {
        setSavingToLead(true);
        try {
          await saveLeadSite(backendUrl, lead.id, html2);
          log('✔ Site salvo no lead no CRM.', 'ok');
        } catch (e) {
          log('✘ Não consegui salvar o site no lead: ' + (e as Error).message, 'err');
        } finally {
          setSavingToLead(false);
        }
      }
    } catch (e) {
      log('✘ Erro: ' + (e as Error).message, 'err');
      setStatus('Ocorreu um erro.');
    } finally {
      setGenerating(false);
    }
  }

  const fileName = (formData.name || 'site').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.html';

  return (
    <div className="max-w-[1360px] mx-auto px-6 pt-7 pb-20">
      {lead ? (
        <>
          <button
            onClick={() => navigate(`/crm/${lead.id}`)}
            className="flex items-center gap-1.5 text-[13px] text-[#5f6570] hover:text-[#1a1d21] mb-3"
          >
            <ArrowLeft size={15} /> Voltar para o lead
          </button>
          <PageHeader
            title="Criar"
            description={`Dados carregados automaticamente do lead "${lead.name}" — edite se quiser antes de gerar.`}
          />
        </>
      ) : (
        <PageHeader title="Criar" />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-5.5 items-start">
        <div>
          <Card className="p-5 mb-3">
            <h2 className="text-[15px] text-[#1a1d21] mb-3">Lead do CRM</h2>
            <div className="space-y-3">
              <Field label="Buscar lead">
                <input
                  value={leadSearch}
                  onChange={(e) => setLeadSearch(e.target.value)}
                  placeholder="Nome, cidade ou segmento"
                  className={'w-full ' + inputClassName}
                />
              </Field>
              <Field label="Selecionar lead">
                <select
                  value={lead?.id || ''}
                  onChange={(e) => handleLeadChange(e.target.value)}
                  className={'w-full ' + inputClassName}
                  disabled={loadingLeads}
                >
                  <option value="">{loadingLeads ? 'Carregando leads...' : 'Escolha um lead do CRM'}</option>
                  {filteredLeads.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} — {item.city}{item.state ? `/${item.state}` : ''}
                    </option>
                  ))}
                </select>
              </Field>
              {crmLeads.length === 0 && !loadingLeads && (
                <p className="text-[12px] text-[#8a919d]">Nenhum lead encontrado no CRM.</p>
              )}
            </div>
          </Card>
          <ApiKeyPanel
            modelText={modelText}
            setModelText={setModelText}
            modelImage={modelImage}
            setModelImage={setModelImage}
          />
          <BusinessForm
            data={formData}
            setData={updateFormData}
            onGenerate={handleCreateStoryboard}
            generating={generating}
            status={savingToLead ? 'Salvando site no lead...' : status}
            logs={logs}
            referenceUrl={referenceUrl}
            setReferenceUrl={updateReferenceUrl}
          />

          {storyboard && (
            <Card className="p-5 mt-4.5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h2 className="text-[15px] font-semibold text-[#1a1d21]">Storyboard pronto para aprovação</h2>
                  <p className="text-[12.5px] text-[#5f6570] mt-1">Revise a direção de arte. Alterar os dados ou a referência exige um novo storyboard.</p>
                </div>
                <Sparkles size={18} className="text-blue-600 shrink-0" />
              </div>
              <pre className="whitespace-pre-wrap font-sans text-[12.5px] leading-relaxed text-[#3b4252] bg-[#f7f8fa] border border-[#e4e7ec] rounded-xl p-3.5 max-h-[440px] overflow-y-auto">{storyboard}</pre>
              <div className="grid grid-cols-2 gap-2.5 mt-3.5">
                <button
                  type="button"
                  onClick={handleCreateStoryboard}
                  disabled={generating}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d4d9e0] py-3 text-[13px] font-semibold text-[#3b4252] hover:border-[#9aa0ab] disabled:opacity-50"
                >
                  <RefreshCw size={15} /> Refazer
                </button>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={generating}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-[13px] font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  <Check size={16} /> Aprovar e gerar
                </button>
              </div>
            </Card>
          )}
        </div>

        <PreviewPanel html={finalHtml} fileName={fileName} />
      </div>
    </div>
  );
}
