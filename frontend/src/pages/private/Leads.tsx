import { useEffect, useRef, useState } from 'react';
import { Search, Phone, MapPin, Send, Globe, Download, History, X } from 'lucide-react';
import { PageHeader, Card } from '../../components/layout';
import Select from '../../components/Select';
import { fetchStates, fetchCities, fetchNiches, fetchLeadUsage } from '../../lib/geo';
import { searchLeads, sendLeadsToCrm } from '../../lib/leads';
import type { GeoState, NicheOption, LeadSearchResult, LeadTier } from '../../types';
import { TIER_COLORS } from '../../types';

interface Props {
  backendUrl: string;
}

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

const LAST_SEARCH_KEY = 'prospectolead:last-lead-search:v1';

interface PersistedSearch {
  filters: { country: string; uf: string; city: string; niche: string; limit: number };
  results: LeadSearchResult[];
  searchedAt: string;
  usage?: { used: number; limit: number };
}

function loadPersistedSearch(): PersistedSearch | null {
  try {
    const raw = localStorage.getItem(LAST_SEARCH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedSearch;
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.results)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function formatSearchedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function Leads({ backendUrl }: Props) {
  const [states, setStates] = useState<GeoState[]>([]);
  const [niches, setNiches] = useState<NicheOption[]>([]);
  const [country] = useState('BR');
  const [uf, setUf] = useState('');
  const [cities, setCities] = useState<string[]>([]);
  const [city, setCity] = useState('');
  const [niche, setNiche] = useState('');
  const [limit, setLimit] = useState(20);
  // LIMITE MENSAL DESATIVADO — contador oculto. Para reativar: renomeie
  // _usage de volta para usage e descomente o bloco actions abaixo.
  // (o prefixo _ mantém o tsc noUnusedLocals sem erro enquanto desativado)
  const [_usage, setUsage] = useState<{ used: number; limit: number }>({ used: 0, limit: 40 });

  const [loadingCities, setLoadingCities] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  const [results, setResults] = useState<LeadSearchResult[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [searchedAt, setSearchedAt] = useState<string | null>(null);
  // Filtros usados na última busca executada (a linha "Última busca em..."
  // deve refletir a busca feita, não o que está digitado no formulário agora).
  const [searchedFilters, setSearchedFilters] = useState<{ uf: string; city: string; niche: string } | null>(null);

  // Guarda a cidade restaurada do localStorage para não ser apagada pelo efeito de UF
  const pendingCityRef = useRef<string | null>(null);
  const isFirstUfEffect = useRef(true);

  useEffect(() => {
    fetchStates(backendUrl).then(setStates).catch(() => {});
    fetchNiches(backendUrl).then(setNiches).catch(() => {});
    fetchLeadUsage(backendUrl).then(setUsage).catch(() => {});

    // Restaura última busca (filtros + resultados) sem gastar cota de novo
    const persisted = loadPersistedSearch();
    if (persisted) {
      if (persisted.filters?.uf) {
        pendingCityRef.current = persisted.filters.city || null;
        setUf(persisted.filters.uf);
      }
      if (persisted.filters?.city) setCity(persisted.filters.city);
      if (persisted.filters?.niche) setNiche(persisted.filters.niche);
      if (persisted.filters?.limit) setLimit(persisted.filters.limit);
      setResults(persisted.results);
      setSearchedAt(persisted.searchedAt);
      if (persisted.filters) {
        setSearchedFilters({
          uf: persisted.filters.uf || '',
          city: persisted.filters.city || '',
          niche: persisted.filters.niche || '',
        });
      }
      if (persisted.usage) setUsage(persisted.usage);
    }
  }, [backendUrl]);

  useEffect(() => {
    // Na primeira execução após restaurar, mantém a cidade salva
    if (isFirstUfEffect.current) {
      isFirstUfEffect.current = false;
      if (pendingCityRef.current !== null) {
        const restoredCity = pendingCityRef.current;
        pendingCityRef.current = null;
        if (!uf) return;
        setLoadingCities(true);
        fetchCities(backendUrl, uf)
          .then((list) => {
            setCities(list);
            // Mantém a cidade salva mesmo se ela não vier na lista (ex.: dado antigo)
            if (restoredCity) setCity(restoredCity);
          })
          .catch((e) => setError(e.message))
          .finally(() => setLoadingCities(false));
        return;
      }
    }
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
    if (!niche) {
      setError('Escolha o nicho antes de buscar.');
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
      const at = new Date().toISOString();
      setSearchedAt(at);
      setSearchedFilters({ uf, city, niche });
      try {
        const payload: PersistedSearch = {
          filters: { country, uf, city, niche, limit },
          results: found,
          searchedAt: at,
          usage: newUsage,
        };
        localStorage.setItem(LAST_SEARCH_KEY, JSON.stringify(payload));
      } catch {
        // localStorage cheio ou indisponível: a busca continua funcionando
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSearching(false);
    }
  }

  function clearHistory() {
    try {
      localStorage.removeItem(LAST_SEARCH_KEY);
    } catch {
      // ignore
    }
    setResults([]);
    setSearchedAt(null);
    setSearchedFilters(null);
    setSelected(new Set());
    setSentIds(new Set());
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
        // LIMITE MENSAL DESATIVADO — contador oculto. Para reativar, descomente:
        // actions={
        //   <span className="text-[12.5px] text-[#5f6570]">
        //     {usage.used} / {usage.limit} leads este mês
        //   </span>
        // }
      />

      <Card className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5">
          <Select value={country} onChange={() => {}} options={[{ value: 'BR', label: 'Brasil' }]} disabled searchable />

          <Select
            value={uf}
            onChange={(v) => setUf(v)}
            options={[{ value: '', label: 'Todos os estados' }, ...states.map((s) => ({ value: s.uf, label: s.name }))]}
            placeholder="Todos os estados"
            searchable
            searchPlaceholder="Buscar estado..."
          />

          <Select
            value={city}
            onChange={(v) => setCity(v)}
            options={[
              { value: '', label: loadingCities ? 'Carregando...' : 'Todas as cidades' },
              ...cities.map((c) => ({ value: c, label: c })),
            ]}
            placeholder="Todas as cidades"
            disabled={loadingCities}
            searchable
            searchPlaceholder="Buscar cidade..."
          />

          <Select
            value={niche}
            onChange={(v) => setNiche(v)}
            options={[{ value: '', label: 'Selecione o nicho' }, ...niches.map((n) => ({ value: n.value, label: n.label }))]}
            placeholder="Selecione ou digite o nicho"
            searchable
            searchPlaceholder="Buscar ou digitar nicho..."
            creatable
            createLabel={(q) => `Buscar por "${q}"`}
          />

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
            Quantidades maiores retornam mais resultados por busca.
          </span>
        </div>

        {error && <div className="mt-3 text-[12.5px] text-[#d64545]">{error}</div>}
      </Card>

      {searchedAt && (
        <div className="flex items-center gap-2 mt-4 text-[12.5px] text-[#5f6570]">
          <History size={14} className="text-[#9aa0ab]" />
          <span>
            Última busca em <b className="text-[#1a1d21]">{formatSearchedAt(searchedAt)}</b>
            {searchedFilters?.niche && (
              <>
                {' '}
                · {searchedFilters.niche} em{' '}
                {searchedFilters.city
                  ? `${searchedFilters.city}/${searchedFilters.uf}`
                  : searchedFilters.uf || 'Brasil'}
              </>
            )}{' '}
            · {results.length} {results.length === 1 ? 'lead' : 'leads'} (salvo neste navegador)
          </span>
          <button
            onClick={clearHistory}
            className="ml-auto flex items-center gap-1 text-[#9aa0ab] hover:text-[#d64545]"
            title="Apagar histórico salvo neste navegador"
          >
            <X size={14} /> Limpar
          </button>
        </div>
      )}

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
