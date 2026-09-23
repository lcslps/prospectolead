import { useState } from 'react';
import { TEXT_MODELS, IMAGE_MODELS } from '../types';
import { callGeminiText } from '../lib/gemini';
import { checkCloudflareStatus } from '../lib/cloudflare';

interface Props {
  apiKey: string;
  setApiKey: (v: string) => void;
  backendUrl: string;
  setBackendUrl: (v: string) => void;
  modelText: string;
  setModelText: (v: string) => void;
  modelImage: string;
  setModelImage: (v: string) => void;
}

export default function ApiKeyPanel({
  apiKey,
  setApiKey,
  backendUrl,
  setBackendUrl,
  modelText,
  setModelText,
  modelImage,
  setModelImage,
}: Props) {
  const [showKey, setShowKey] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [testingBackend, setTestingBackend] = useState(false);

  async function testKey() {
    if (!apiKey.trim()) {
      alert('Cole sua API key primeiro.');
      return;
    }
    setTestingKey(true);
    try {
      const txt = await callGeminiText(apiKey.trim(), 'gemini-3.8-flash', 'Responda apenas com uma palavra.', 'Diga OK');
      alert('Conexão funcionando! Resposta do modelo: ' + txt.trim().slice(0, 50));
    } catch (e) {
      alert('Erro ao conectar: ' + (e as Error).message);
    } finally {
      setTestingKey(false);
    }
  }

  async function testBackend() {
    if (!backendUrl.trim()) {
      alert('Informe a URL do backend Cloudflare.');
      return;
    }
    setTestingBackend(true);
    try {
      const data = await checkCloudflareStatus(backendUrl);
      alert('Cloudflare configurado! Modelo padrão: ' + (data.defaultModel || 'FLUX.2 Klein 4B'));
    } catch (e) {
      alert('Erro no Cloudflare: ' + (e as Error).message);
    } finally {
      setTestingBackend(false);
    }
  }

  return (
    <div className="bg-gradient-to-b from-[#16181d] to-[#1d2027] border border-[#2a2d35] rounded-[14px] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] text-[#eef0f3] mb-0.5">Chave de API do Gemini</h2>
          <p className="text-[#9aa0ab] text-[12.5px] leading-relaxed mb-3">
            Pegue sua chave gratuita em aistudio.google.com/apikey. Ela fica salva só no seu navegador
            (localStorage), nunca é enviada para nenhum servidor além do Google.
          </p>
        </div>
        <button
          onClick={testKey}
          disabled={testingKey}
          className="shrink-0 bg-[#22252c] text-[#eef0f3] border border-[#2a2d35] hover:border-[#3a3f4a] rounded-[10px] px-3.5 py-2 text-[13px] font-medium disabled:opacity-50"
        >
          {testingKey ? 'Testando...' : 'Testar API Key'}
        </button>
      </div>

      <div className="flex gap-2">
        <input
          type={showKey ? 'text' : 'password'}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="AIza..."
          className="flex-1 bg-[#0f1114] border border-[#2a2d35] focus:border-[#5b8cff] rounded-[10px] px-3 py-2.5 text-[13.5px] text-[#eef0f3] outline-none"
        />
        <button
          onClick={() => setShowKey((v) => !v)}
          className="bg-[#22252c] text-[#eef0f3] border border-[#2a2d35] hover:border-[#3a3f4a] rounded-[10px] px-3.5 py-2 text-[13px]"
        >
          👁
        </button>
      </div>

      <details className="mt-4 group">
        <summary className="cursor-pointer text-[12.5px] text-[#9aa0ab] font-medium group-open:text-[#eef0f3]">
          Configurações avançadas de modelo
        </summary>
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-[12.5px] text-[#9aa0ab] font-medium mb-1.5">
              Modelo de texto (geração do site)
            </label>
            <select
              value={modelText}
              onChange={(e) => setModelText(e.target.value)}
              className="w-full bg-[#0f1114] border border-[#2a2d35] focus:border-[#5b8cff] rounded-[10px] px-3 py-2.5 text-[13.5px] text-[#eef0f3] outline-none"
            >
              {TEXT_MODELS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[12.5px] text-[#9aa0ab] font-medium mb-1.5">
              Modelo de imagem (Cloudflare Workers AI)
            </label>
            <select
              value={modelImage}
              onChange={(e) => setModelImage(e.target.value)}
              className="w-full bg-[#0f1114] border border-[#2a2d35] focus:border-[#5b8cff] rounded-[10px] px-3 py-2.5 text-[13.5px] text-[#eef0f3] outline-none"
            >
              {IMAGE_MODELS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[12.5px] text-[#9aa0ab] font-medium mb-1.5">Backend Cloudflare</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={backendUrl}
                onChange={(e) => setBackendUrl(e.target.value)}
                placeholder="http://localhost:3001"
                className="flex-1 bg-[#0f1114] border border-[#2a2d35] focus:border-[#5b8cff] rounded-[10px] px-3 py-2.5 text-[13.5px] text-[#eef0f3] outline-none"
              />
              <button
                onClick={testBackend}
                disabled={testingBackend}
                className="bg-[#22252c] text-[#eef0f3] border border-[#2a2d35] hover:border-[#3a3f4a] rounded-[10px] px-3.5 py-2 text-[13px] disabled:opacity-50"
              >
                {testingBackend ? 'Testando...' : 'Testar'}
              </button>
            </div>
            <p className="text-[#9aa0ab] text-[12px] leading-relaxed mt-2">
              O token da Cloudflare fica no arquivo <b>.env</b> do backend, nunca dentro do frontend.
            </p>
          </div>
        </div>
      </details>
    </div>
  );
}
