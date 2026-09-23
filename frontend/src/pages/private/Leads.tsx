import { useEffect, useState } from 'react';
import { Search, Phone, MapPin, Send, Globe, Download } from 'lucide-react';
import { PageHeader, Card } from '../../components/layout';
import { fetchStates, fetchCities, fetchNiches, fetchLeadUsage } from '../../lib/geo';
import { searchLeads, sendLeadsToCrm } from '../../lib/leads';
import type { GeoState, NicheOption, LeadSearchResult, LeadTier } from '../../types';
import { TIER_COLORS } from '../../types';

interface Props {
  backendUrl: string;
}

const selectClass =
  'bg-white border border-[#d4d9e0] focus:border-[#5b8cff] rounded-[10px] px-3.5 py-2.5 text-[13.5px] text-[#1a1d21] outline-none disabled:bg-[#f4f6f9] disabled:text-[#9aa0ab]';

function TierBadge({ tier }: { tier: LeadTier }) {
  const c = TIER_COLORS[tier];
  return (
    <span
      className="text-[11px] font-semibold px-2 py-1 rounded-full"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {tier}
    </span>
  );
}

export default function Leads({ backendUrl }: Props) {
  const [states, setStates] = useState<GeoState[]>([]);
  const [niches, setNiches] = useState<NicheOption[]>([]);
  const [uf, setUf] = useState('');
  const [cities, setCities] = useState<string[]>([]);
  const [city, setCity] = useState('');
  const [niche, setNiche] = useState('');
  const [limit, setLimit] = useState(20);
  const [usage, setUsage] = useState<{ used: number; limit: number }>({ used: 0, limit: 40 });

  const [loadingCities, setLoadingCities] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  const [results, setResults] = useState<LeadSearchResult[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchStates(backendUrl).then(setStates).catch(() => {});
    fetchNiches(backendUrl).then(setNiches).catch(() => {});
    fetchLeadUsage(backendUrl).then(setUsage).catch(() => {});
  }, [backendUrl]);

  useEffect(() => {
    setCity('');
    setCities([]);
    if (!uf) return;
    setLoadingCities(true);
    fetchCities(backendUrl, uf)
      .then(setCities)
      .catch((e) => setError(e.message))
      .finally(() => setLoadingCities(false));
  }, [uf, backendUrl]);

  const semSite = results.filter((r) => !r.hasSite).length;

  function toggleSelect(placeId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(placeId)) next.delete(placeId);
      else next.add(placeId);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === results.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(results.map((r) => r.placeId || r.name)));
    }
  }

  async function handleSearch() {
    if (!city || !niche) {
      setError('Escolha o estado, a cidade e o nicho antes de buscar.');
      return;
    }
    setError('');
    setSearching(true);
    setSelected(new Set());
    setSentIds(new Set());
    try {
      const { results: found, usage: newUsage } = await searchLeads(backendUrl, { state: uf, city, niche, limit });
      setResults(found);
      setUsage(newUsage);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSearching(false);
    }
  }

  async function handleSendToCrm(leads: LeadSearchResult[]) {
    if (leads.length === 0) return;
    setSending(true);
    setError('');
    try {
      const saved = await sendLeadsToCrm(backendUrl, leads);
      setSentIds((prev) => {
        const next = new Set(prev);
        saved.forEach((l) => l.placeId && next.add(l.placeId));
        return next;
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  }

  function exportCsv() {
    const rows = [
      ['Nome', 'Nicho', 'Cidade', 'Telefone', 'Tem site', 'Site', 'Avaliação', 'Avaliações', 'Endereço'],
      ...results.map((r) => [
        r.name,
        r.niche,
        r.city,
        r.phone,
        r.hasSite ? 'Sim' : 'Não',
        r.websiteUrl,
        r.rating ?? '',
        String(r.reviewCount),
        r.address,
      ]),
    ];
    const csv = rows.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'leads.csv';
    a.click();
  }

  const selectedLeads = results.filter((r) => selected.has(r.placeId || r.name));

  return (
    <div className="max-w-[1360px] mx-auto px-6 pt-7 pb-20">
      <PageHeader
        title="Buscar Leads"
        description="Encontre negócios locais por categoria e localização"
        actions={
          <span className="text-[12.5px] text-[#5f6570]">
            {usage.used} / {usage.limit} leads este mês
          </span>
        }
      />

      <Card className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5">
          <select className={selectClass} value="BR" disabled>
            <option value="BR">Brasil</option>
          </select>

          <select className={selectClass} value={uf} onChange={(e) => setUf(e.target.value)}>
            <option value="">Selecione o estado</option>
            {states.map((s) => (
              <option key={s.uf} value={s.uf}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            className={selectClass}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            disabled={!uf || loadingCities}
          >
            <option value="">{!uf ? 'Escolha o estado primeiro' : loadingCities ? 'Carregando...' : 'Selecione a cidade'}</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select className={selectClass} value={niche} onChange={(e) => setNiche(e.target.value)}>
            <option value="">Selecione o nicho</option>
            {niches.map((n) => (
              <option key={n.value} value={n.value}>
                {n.label}
              </option>
            ))}
          </select>

          <button
            onClick={handleSearch}
            disabled={searching}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-[10px] px-4 py-2.5 text-[13.5px]"
          >
            <Search size={16} strokeWidth={2.25} />
            {searching ? 'Buscando...' : 'Buscar'}
          </button>
        </div>

        <div className="flex items-center gap-3 mt-5">
          <span className="text-[13.5px] font-medium text-[#1a1d21]">Quantidade</span>
          {[20, 40, 60].map((n) => (
            <button
              key={n}
              onClick={() => setLimit(n)}
              className={
                'w-11 h-9 rounded-lg text-[13px] font-semibold ' +
                (limit === n ? 'bg-blue-600 text-white' : 'bg-[#f1f3f6] text-[#5f6570] hover:bg-[#e8ebf0]')
              }
            >
              {n}
            </button>
          ))}
          <span className="text-[12px] text-[#9aa0ab] ml-2">
            Quantidades maiores consomem mais da sua cota mensal.
          </span>
        </div>

        {error && <div className="mt-3 text-[12.5px] text-[#d64545]">{error}</div>}
      </Card>

      {results.length > 0 && (
        <>
          <div className="flex items-center justify-between mt-5 mb-3">
            <label className="flex items-center gap-2 text-[13px] text-[#1a1d21] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={selected.size === results.length && results.length > 0}
                onChange={toggleSelectAll}
              />
              Selecionar todos
            </label>

            <div className="flex items-center gap-3">
              <span className="text-[12.5px] text-[#5f6570]">
                <b className="text-[#1a1d21]">{semSite}</b> Sem site &nbsp;·&nbsp;{' '}
                <b className="text-[#1a1d21]">{results.length}</b> Total
              </span>
              <button
                onClick={exportCsv}
                className="flex items-center gap-1.5 border border-[#d4d9e0] rounded-[10px] px-3.5 py-2 text-[13px] text-[#1a1d21] hover:bg-[#f4f6f9]"
              >
                <Download size={14} /> Exportar CSV
              </button>
              <button
                onClick={() => handleSendToCrm(selectedLeads)}
                disabled={selectedLeads.length === 0 || sending}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-[10px] px-3.5 py-2 text-[13px]"
              >
                <Send size={14} /> Enviar para CRM {selectedLeads.length > 0 && `(${selectedLeads.length})`}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {results.map((lead) => {
              const key = lead.placeId || lead.name;
              const isSelected = selected.has(key);
              const isSent = lead.placeId ? sentIds.has(lead.placeId) : false;
              return (
                <Card key={key} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-[14.5px] text-[#1a1d21] leading-snug">{lead.name}</h3>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(key)}
                      className="mt-1 shrink-0"
                    />
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[11px] bg-[#eef1f5] text-[#5f6570] px-2 py-1 rounded-full">
                      {lead.niche}
                    </span>
                    <TierBadge tier={lead.tier} />
                    <span className="ml-auto text-[13px] font-bold text-[#e08a2f]">{lead.score}</span>
                  </div>

                  {lead.rating !== null && (
                    <div className="text-[12px] text-[#9aa0ab] mt-1">
                      ★ {lead.rating.toFixed(1)} · {lead.reviewCount}
                    </div>
                  )}

                  <div className="mt-3 space-y-1.5 text-[13px] text-[#1a1d21]">
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-[#9aa0ab]" />
                      {lead.phone || <span className="text-[#9aa0ab]">Sem telefone</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-[#9aa0ab]" />
                      {lead.city}
                      <span
                        className={
                          'text-[10.5px] font-semibold px-2 py-0.5 rounded-full ' +
                          (lead.hasSite ? 'bg-[#e7f6ee] text-[#0e7c5b]' : 'bg-[#fdeaea] text-[#d64545]')
                        }
                      >
                        {lead.hasSite ? 'Tem site' : 'Sem site'}
                      </span>
                    </div>
                    {lead.address && <div className="text-[12px] text-[#5f6570] pl-6">{lead.address}</div>}
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleSendToCrm([lead])}
                      disabled={sending || isSent}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-[10px] py-2 text-[12.5px]"
                    >
                      <Send size={13} /> {isSent ? 'Enviado' : 'Enviar para CRM'}
                    </button>
                    {lead.hasSite && lead.websiteUrl && (
                      <a
                        href={lead.websiteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-1.5 border border-[#d4d9e0] rounded-[10px] px-3 text-[12.5px] text-[#1a1d21] hover:bg-[#f4f6f9]"
                      >
                        <Globe size={13} /> Site atual
                      </a>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
