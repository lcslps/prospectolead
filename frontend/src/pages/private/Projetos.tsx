import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, RefreshCw, MoreVertical, Pencil, Copy, Trash2, X } from 'lucide-react';
import { PageHeader, Card } from '../../components/layout';
import { listSites, deleteLeadSite, duplicateLeadSite, updateCrmLead } from '../../lib/leads';
import type { Lead } from '../../types';

interface Props {
  backendUrl: string;
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function Projetos({ backendUrl }: Props) {
  const navigate = useNavigate();
  const [sites, setSites] = useState<Lead[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<Lead | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [savingRename, setSavingRename] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await listSites(backendUrl);
      setSites(data.sites);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backendUrl]);

  // Fecha o menu de 3 pontinhos ao clicar fora
  useEffect(() => {
    if (!openMenuId) return;
    function close() {
      setOpenMenuId(null);
    }
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [openMenuId]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return sites;
    return sites.filter((s) =>
      `${s.name} ${s.niche} ${s.city} ${s.state}`.toLowerCase().includes(query)
    );
  }, [sites, q]);

  function openRename(site: Lead) {
    setOpenMenuId(null);
    setRenaming(site);
    setRenameValue(site.name);
  }

  async function confirmRename() {
    if (!renaming || !renameValue.trim()) return;
    setSavingRename(true);
    try {
      const updated = await updateCrmLead(backendUrl, renaming.id, { name: renameValue.trim() });
      setSites((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setRenaming(null);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSavingRename(false);
    }
  }

  async function handleDuplicate(site: Lead) {
    setOpenMenuId(null);
    setBusyId(site.id);
    try {
      const copy = await duplicateLeadSite(backendUrl, site.id);
      setSites((prev) => [copy, ...prev]);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleRemoveSite(site: Lead) {
    setOpenMenuId(null);
    if (!confirm(`Excluir o site "${site.name}"? O lead continua no CRM.`)) return;
    setBusyId(site.id);
    try {
      await deleteLeadSite(backendUrl, site.id);
      setSites((prev) => prev.filter((s) => s.id !== site.id));
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="max-w-[1360px] mx-auto px-6 pt-7 pb-20">
      <PageHeader
        title="Projetos"
        description="Todos os sites já gerados — clique no card para ver o preview"
        actions={
          <button
            onClick={load}
            className="flex items-center gap-1.5 border border-[#d4d9e0] rounded-[10px] px-3.5 py-2 text-[13px] hover:bg-white"
          >
            <RefreshCw size={14} /> Atualizar
          </button>
        }
      />

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar projeto por empresa, nicho ou cidade..."
        className="w-full bg-white border border-[#d4d9e0] focus:border-[#5b8cff] rounded-[12px] px-4 py-3 text-[13.5px] outline-none mb-5"
      />

      {error && <div className="text-[12.5px] text-[#d64545] mb-3">{error}</div>}
      {loading && <div className="text-[12.5px] text-[#9aa0ab] mb-3">Carregando projetos...</div>}

      {!loading && filtered.length === 0 && (
        <Card className="p-10 text-center">
          <Globe size={28} className="mx-auto mb-3 text-[#9aa0ab]" />
          <p className="text-[14px] font-semibold text-[#1a1d21]">Nenhum site gerado ainda</p>
          <p className="text-[13px] text-[#5f6570] mt-1 mb-4">
            Gere um site a partir de um lead do CRM e ele aparece aqui automaticamente.
          </p>
          <button
            onClick={() => navigate('/crm')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-[10px] px-5 py-2.5 text-[13.5px]"
          >
            Ir para o CRM
          </button>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((site) => (
          <Card
            key={site.id}
            className="p-5 cursor-pointer hover:shadow-md transition-shadow relative"
          >
            <div onClick={() => navigate(`/projetos/${site.id}`)}>
              <div className="flex items-start gap-3 mb-3 pr-8">
                <div className="w-10 h-10 rounded-[10px] bg-blue-600/10 text-blue-600 flex items-center justify-center shrink-0">
                  <Globe size={18} />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-[14.5px] text-[#1a1d21] leading-snug truncate">
                    {site.name}
                    {busyId === site.id ? ' · ...' : ''}
                  </div>
                  <div className="text-[12.5px] text-[#5f6570] truncate">
                    {site.niche || 'Sem nicho'} · {site.city}
                    {site.state ? `/${site.state}` : ''}
                  </div>
                </div>
              </div>

              <div className="text-[12px] text-[#9aa0ab]">
                Gerado em {formatDate(site.siteGeneratedAt)}
              </div>
            </div>

            {/* Botão 3 pontinhos */}
            <div className="absolute top-4 right-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuId(openMenuId === site.id ? null : site.id);
                }}
                className="p-1.5 rounded-lg text-[#5f6570] hover:bg-[#f1f3f6] hover:text-[#1a1d21]"
                title="Opções"
              >
                <MoreVertical size={17} />
              </button>

              {openMenuId === site.id && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-9 w-44 bg-white border border-[#e4e7ec] rounded-[12px] shadow-lg py-1.5 z-20"
                >
                  <button
                    onClick={() => openRename(site)}
                    className="w-full flex items-center gap-2 px-4 py-2 text-[13px] text-[#1a1d21] hover:bg-[#f4f6f9]"
                  >
                    <Pencil size={14} /> Renomear
                  </button>
                  <button
                    onClick={() => handleDuplicate(site)}
                    className="w-full flex items-center gap-2 px-4 py-2 text-[13px] text-[#1a1d21] hover:bg-[#f4f6f9]"
                  >
                    <Copy size={14} /> Duplicar
                  </button>
                  <button
                    onClick={() => handleRemoveSite(site)}
                    className="w-full flex items-center gap-2 px-4 py-2 text-[13px] text-[#d64545] hover:bg-[#fdf0f0]"
                  >
                    <Trash2 size={14} /> Excluir
                  </button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {filtered.length > 0 && (
        <p className="text-[12px] text-[#9aa0ab] mt-5">
          {filtered.length} projeto{filtered.length === 1 ? '' : 's'} · {sites.length} no total
        </p>
      )}

      {/* Modal renomear */}
      {renaming && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
          <Card className="w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-[15px]">Renomear projeto</h3>
              <button onClick={() => setRenaming(null)}>
                <X size={18} />
              </button>
            </div>
            <input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmRename();
              }}
              placeholder="Nome do projeto"
              autoFocus
              className="w-full border border-[#d4d9e0] rounded-[10px] px-3 py-2.5 text-[13.5px] outline-none focus:border-[#5b8cff]"
            />
            <button
              onClick={confirmRename}
              disabled={savingRename || !renameValue.trim()}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-[10px] py-2.5 text-[13.5px]"
            >
              {savingRename ? 'Salvando...' : 'Salvar'}
            </button>
          </Card>
        </div>
      )}
    </div>
  );
}
