import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { getCrmLead } from '../../lib/leads';
import type { Lead } from '../../types';

interface Props {
  backendUrl: string;
}

export default function ProjetoPreview({ backendUrl }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    getCrmLead(backendUrl, id)
      .then(setLead)
      .catch((e) => setError((e as Error).message));
  }, [id, backendUrl]);

  if (error) {
    return (
      <div className="max-w-[900px] mx-auto px-6 pt-7">
        <button
          onClick={() => navigate('/projetos')}
          className="flex items-center gap-1.5 text-[13px] text-[#5f6570] hover:text-[#1a1d21] mb-4"
        >
          <ArrowLeft size={15} /> Projetos
        </button>
        <p className="text-[#d64545] text-[13.5px]">{error}</p>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="max-w-[900px] mx-auto px-6 pt-7">
        <p className="text-[#9aa0ab] text-[13.5px]">Carregando preview...</p>
      </div>
    );
  }

  if (!lead.siteUrl) {
    return (
      <div className="max-w-[900px] mx-auto px-6 pt-7">
        <button
          onClick={() => navigate('/projetos')}
          className="flex items-center gap-1.5 text-[13px] text-[#5f6570] hover:text-[#1a1d21] mb-4"
        >
          <ArrowLeft size={15} /> Projetos / <span className="text-[#1a1d21] font-medium">{lead.name}</span>
        </button>
        <p className="text-[13.5px] text-[#5f6570]">Este projeto não tem site gerado.</p>
      </div>
    );
  }

  const src = backendUrl.replace(/\/$/, '') + lead.siteUrl;

  return (
    <div className="h-full flex flex-col px-6 pt-7 pb-6">
      <div className="max-w-[1360px] w-full mx-auto flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate('/projetos')}
          className="flex items-center gap-1.5 text-[13px] text-[#5f6570] hover:text-[#1a1d21] shrink-0"
        >
          <ArrowLeft size={15} /> Projetos
        </button>
        <span className="text-[#d4d9e0]">/</span>
        <h1 className="text-[15px] font-semibold text-[#1a1d21] truncate">{lead.name}</h1>
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          className="ml-auto flex items-center gap-1.5 border border-[#d4d9e0] rounded-[10px] px-3.5 py-2 text-[12.5px] hover:bg-white shrink-0"
        >
          <ExternalLink size={13} /> Abrir em nova aba
        </a>
      </div>

      <div className="max-w-[1360px] w-full mx-auto flex-1 min-h-0">
        <iframe
          title={lead.name}
          src={src}
          className="w-full h-[calc(100vh-180px)] min-h-[500px] bg-white border border-[#e4e7ec] rounded-[14px]"
        />
      </div>
    </div>
  );
}
