import { useEffect, useRef, useState } from 'react';
import ApiKeyPanel from './components/ApiKeyPanel';
import BusinessForm from './components/BusinessForm';
import PreviewPanel from './components/PreviewPanel';
import { callGeminiTextWithFallback } from './lib/gemini';
import { callCloudflareImage } from './lib/cloudflare';
import { buildUserPrompt, parseModelOutput, STYLE_GUIDE, FALLBACK_IMAGE_SVG } from './lib/prompts';
import type { BusinessFormData, LogEntry, LogKind } from './types';
import { DEFAULT_SECTIONS } from './types';

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

function defaultBackend() {
  return 'http://localhost:3001';
}

function initialBackendUrl() {
  const saved = (localStorage.getItem('cloudflare_backend') || '').trim();
  // Descarta o default antigo bugado (origin do próprio frontend, ex: :5173)
  if (typeof window !== 'undefined' && saved.replace(/\/$/, '') === window.location.origin) {
    return defaultBackend();
  }
  return saved || defaultBackend();
}

export default function App() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [backendUrl, setBackendUrl] = useState(initialBackendUrl);
  const [modelText, setModelText] = useState('gemini-3.8-flash');
  const [modelImage, setModelImage] = useState('@cf/black-forest-labs/flux-2-klein-4b');

  const [formData, setFormData] = useState<BusinessFormData>(EMPTY_FORM);
  const [generating, setGenerating] = useState(false);
  const [status, setStatus] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [finalHtml, setFinalHtml] = useState('');
  const logId = useRef(0);

  useEffect(() => localStorage.setItem('gemini_api_key', apiKey), [apiKey]);
  useEffect(() => localStorage.setItem('cloudflare_backend', backendUrl.trim()), [backendUrl]);

  function log(text: string, kind: LogKind = 'muted') {
    logId.current += 1;
    setLogs((prev) => [...prev, { id: logId.current, text, kind }]);
  }

  async function handleGenerate() {
    if (!apiKey.trim()) {
      alert('Cole sua API key do Gemini primeiro.');
      return;
    }
    if (!formData.name.trim()) {
      alert('Informe o nome da empresa.');
      return;
    }
    if (!backendUrl.trim()) {
      alert('Informe a URL do backend Cloudflare.');
      return;
    }

    setGenerating(true);
    setLogs([]);
    setFinalHtml('');

    try {
      setStatus('Escrevendo o layout e o conteúdo do site...');
      log('▸ Pedindo ao Gemini para desenhar o site e o roteiro de imagens...', 'go');

      const { text: raw, model: usedModel } = await callGeminiTextWithFallback(
        apiKey.trim(),
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
    <div className="min-h-screen bg-[#0e0f12] text-[#eef0f3] font-['Inter',_sans-serif] [background:radial-gradient(1100px_600px_at_85%_-10%,rgba(91,140,255,.14),transparent_60%),radial-gradient(900px_500px_at_-10%_110%,rgba(126,224,195,.10),transparent_60%),#0e0f12]">
      <div className="max-w-[1360px] mx-auto px-6 pt-7 pb-20">
        <div className="flex items-center justify-between mb-7">
          <div className="flex items-center gap-3">
            <div className="w-[34px] h-[34px] rounded-[9px] bg-gradient-to-br from-[#5b8cff] to-[#7ee0c3] flex items-center justify-center font-extrabold font-['Fraunces',_serif] text-[#0e0f12]">
              AI
            </div>
            <div>
              <h1 className="text-xl font-['Fraunces',_serif] font-semibold tracking-tight">Gerador de Sites</h1>
              <span className="text-[#9aa0ab] text-[12.5px] block mt-0.5">
                Gemini cria o site • Cloudflare FLUX cria as imagens
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-5.5 items-start">
          <div>
            <ApiKeyPanel
              apiKey={apiKey}
              setApiKey={setApiKey}
              backendUrl={backendUrl}
              setBackendUrl={setBackendUrl}
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

        <div className="mt-4 p-3.5 rounded-[10px] bg-[#ffc10714] border border-[#ffc10740] text-[#ffd685] text-[12px] leading-relaxed">
          O Gemini continua sendo chamado diretamente pelo navegador com a sua chave. As imagens passam pelo
          backend Node.js para manter o token da Cloudflare protegido. Rode o backend (pasta <code>backend/</code>)
          antes de gerar um site.
        </div>
      </div>
    </div>
  );
}
