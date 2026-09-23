import { useState } from 'react';
import { Download } from 'lucide-react';
import { Card } from './layout';

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
    <Card className="overflow-hidden min-h-[640px] flex flex-col">
      <div className="flex items-center justify-between px-4.5 py-3.5 border-b border-[#e4e7ec]">
        <div className="flex gap-1.5">
          <button
            onClick={() => setTab('preview')}
            className={
              'px-3.5 py-1.5 rounded-lg text-[12.5px] border ' +
              (tab === 'preview' ? 'bg-[#eef1f5] border-[#e4e7ec] text-[#1a1d21] font-medium' : 'border-transparent text-[#5f6570]')
            }
          >
            Prévia
          </button>
          <button
            onClick={() => setTab('code')}
            className={
              'px-3.5 py-1.5 rounded-lg text-[12.5px] border ' +
              (tab === 'code' ? 'bg-[#eef1f5] border-[#e4e7ec] text-[#1a1d21] font-medium' : 'border-transparent text-[#5f6570]')
            }
          >
            Código
          </button>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 bg-[#eef1f5] border border-[#e4e7ec] rounded-lg p-0.5">
            <button
              onClick={() => setDevice('desktop')}
              className={
                'px-2.5 py-1.5 rounded-md text-[11.5px] ' +
                (device === 'desktop' ? 'bg-white text-[#1a1d21] shadow-sm font-medium' : 'text-[#5f6570]')
              }
            >
              Desktop
            </button>
            <button
              onClick={() => setDevice('mobile')}
              className={
                'px-2.5 py-1.5 rounded-md text-[11.5px] ' +
                (device === 'mobile' ? 'bg-white text-[#1a1d21] shadow-sm font-medium' : 'text-[#5f6570]')
              }
            >
              Mobile
            </button>
          </div>
          <button
            onClick={download}
            disabled={!html}
            className="bg-[#eef1f5] text-[#1a1d21] border border-[#e4e7ec] hover:border-[#c9d0d9] rounded-[10px] px-3.5 py-2 text-[13px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="inline-flex items-center gap-1.5">
              <Download size={15} strokeWidth={2.25} /> Baixar HTML
            </span>
          </button>
        </div>
      </div>

      <div className="flex-1 relative bg-[#f7f8fa]">
        {!html && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-10 gap-2.5 text-[#5f6570]">
            <h3 className="text-[19px] font-medium text-[#1a1d21]">Seu site vai aparecer aqui</h3>
            <p className="text-[13px] leading-relaxed max-w-[380px] m-0">
              Preencha os dados do negócio e clique em "Gerar site". O Gemini cria layout e conteúdo; o
              Cloudflare FLUX produz as fotos automaticamente.
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
                  ? 'max-w-[390px] w-full h-[820px] rounded-[22px] shadow-[0_0_0_8px_#e0e4ea] bg-white border-0'
                  : 'w-full h-full bg-white border-0'
              }
            />
          </div>
        )}

        {html && tab === 'code' && (
          <pre className="m-0 p-4.5 text-[12px] leading-relaxed text-[#3b4252] whitespace-pre-wrap break-words h-full overflow-auto font-mono">
            {html}
          </pre>
        )}
      </div>
    </Card>
  );
}
