import { useRef, useState } from 'react';
import ApiKeyPanel from '../../components/ApiKeyPanel';
import BusinessForm from '../../components/BusinessForm';
import PreviewPanel from '../../components/PreviewPanel';
import { PageHeader } from '../../components/layout';
import { callGeminiTextWithFallback } from '../../lib/gemini';
import { callCloudflareImage } from '../../lib/cloudflare';
import { buildUserPrompt, parseModelOutput, STYLE_GUIDE, FALLBACK_IMAGE_SVG } from '../../lib/prompts';
import type { BusinessFormData, LogEntry, LogKind } from '../../types';
import { DEFAULT_SECTIONS } from '../../types';

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

interface CriarProps {
  backendUrl: string;
}

export default function Criar({ backendUrl }: CriarProps) {
  const [modelText, setModelText] = useState('gemini-3.8-flash');
  const [modelImage, setModelImage] = useState('@cf/black-forest-labs/flux-2-klein-4b');

  const [formData, setFormData] = useState<BusinessFormData>(EMPTY_FORM);
  const [generating, setGenerating] = useState(false);
  const [status, setStatus] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [finalHtml, setFinalHtml] = useState('');
  const logId = useRef(0);

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
      <PageHeader title="Criar" />

      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-5.5 items-start">
        <div>
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
            status={status}
            logs={logs}
          />
        </div>

        <PreviewPanel html={finalHtml} fileName={fileName} />
      </div>
    </div>
  );
}
