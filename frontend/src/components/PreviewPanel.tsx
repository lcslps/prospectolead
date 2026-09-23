import { useState } from 'react';

interface Props {
  html: string;
  fileName: string;
}

export default function PreviewPanel({ html, fileName }: Props) {
  const [tab, setTab] = useState<'preview' | 'code'>('preview');
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');

  function download() {
    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
  }

  return (
    <div className="bg-gradient-to-b from-[#16181d] to-[#1d2027] border border-[#2a2d35] rounded-[14px] overflow-hidden min-h-[640px] flex flex-col">
      <div className="flex items-center justify-between px-4.5 py-3.5 border-b border-[#2a2d35]">
        <div className="flex gap-1.5">
          <button
            onClick={() => setTab('preview')}
            className={
              'px-3.5 py-1.5 rounded-lg text-[12.5px] border ' +
              (tab === 'preview' ? 'bg-[#0f1114] border-[#2a2d35] text-[#eef0f3]' : 'border-transparent text-[#9aa0ab]')
            }
          >
            Prévia
          </button>
          <button
            onClick={() => setTab('code')}
            className={
              'px-3.5 py-1.5 rounded-lg text-[12.5px] border ' +
              (tab === 'code' ? 'bg-[#0f1114] border-[#2a2d35] text-[#eef0f3]' : 'border-transparent text-[#9aa0ab]')
            }
          >
            Código
          </button>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 bg-[#0f1114] border border-[#2a2d35] rounded-lg p-0.5">
            <button
              onClick={() => setDevice('desktop')}
              className={
                'px-2.5 py-1.5 rounded-md text-[11.5px] ' +
                (device === 'desktop' ? 'bg-[#1d2027] text-[#eef0f3]' : 'text-[#9aa0ab]')
              }
            >
              Desktop
            </button>
            <button
              onClick={() => setDevice('mobile')}
              className={
                'px-2.5 py-1.5 rounded-md text-[11.5px] ' +
                (device === 'mobile' ? 'bg-[#1d2027] text-[#eef0f3]' : 'text-[#9aa0ab]')
              }
            >
              Mobile
            </button>
          </div>
          <button
            onClick={download}
            disabled={!html}
            className="bg-[#22252c] text-[#eef0f3] border border-[#2a2d35] hover:border-[#3a3f4a] rounded-[10px] px-3.5 py-2 text-[13px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ⬇ Baixar HTML
          </button>
        </div>
      </div>

      <div className="flex-1 relative bg-[#0b0c0f]">
        {!html && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-10 gap-2.5 text-[#9aa0ab]">
            <h3 className="text-[19px] font-medium text-[#eef0f3]">Seu site vai aparecer aqui</h3>
            <p className="text-[13px] leading-relaxed max-w-[380px] m-0">
              Preencha os dados do negócio, cole sua API key do Gemini e clique em "Gerar site". O Gemini cria
              layout e conteúdo; o Cloudflare FLUX produz as fotos automaticamente.
            </p>
          </div>
        )}

        {html && tab === 'preview' && (
          <div className="absolute inset-0 flex items-start justify-center overflow-auto p-4.5">
            <iframe
              title="preview"
              srcDoc={html}
              className={
                device === 'mobile'
                  ? 'max-w-[390px] w-full h-[820px] rounded-[22px] shadow-[0_0_0_8px_#111] bg-white border-0'
                  : 'w-full h-full bg-white border-0'
              }
            />
          </div>
        )}

        {html && tab === 'code' && (
          <pre className="m-0 p-4.5 text-[12px] leading-relaxed text-[#c9d1e0] whitespace-pre-wrap break-words h-full overflow-auto font-mono">
            {html}
          </pre>
        )}
      </div>
    </div>
  );
}
