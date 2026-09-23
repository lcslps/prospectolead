import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ApiKeyPanel from '../../components/ApiKeyPanel';
import BusinessForm from '../../components/BusinessForm';
import PreviewPanel from '../../components/PreviewPanel';
import { PageHeader } from '../../components/layout';
import { callGeminiTextWithFallback } from '../../lib/gemini';
import { callCloudflareImage } from '../../lib/cloudflare';
import { buildUserPrompt, parseModelOutput, STYLE_GUIDE, FALLBACK_IMAGE_SVG } from '../../lib/prompts';
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
      return;
    }
    getCrmLead(backendUrl, leadId)
      .then((l) => {
        setLead(l);
        setFormData(formDataFromLead(l));
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

  async function handleGenerate() {
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
      setStatus('Escrevendo o layout e o conteúdo do site...');
      log('▸ Pedindo ao Gemini para desenhar o site e o roteiro de imagens...', 'go');

      const { text: raw, model: usedModel } = await callGeminiTextWithFallback(
        backendUrl,
        modelText,
        STYLE_GUIDE,
        buildUserPrompt(formData),
        log
      );
      log(`✔ Layout e conteúdo gerados com ${usedModel}.`, 'ok');

      const { images, html } = parseModelOutput(raw);
      log(`▸ ${images.length} imagens serão geradas: ` + images.map((i) => i.id).join(', '), 'muted');

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
            setData={setFormData}
            onGenerate={handleGenerate}
            generating={generating}
            status={savingToLead ? 'Salvando site no lead...' : status}
            logs={logs}
          />
        </div>

        <PreviewPanel html={finalHtml} fileName={fileName} />
      </div>
    </div>
  );
}
