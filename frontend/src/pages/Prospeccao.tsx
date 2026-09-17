import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Crosshair, Search, Sparkles, CheckCircle2, RefreshCcw, AlertTriangle } from 'lucide-react';
import { postData } from '../services/api';
import type { ProspectResult } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Field } from '../components/ui/Field';
import { Checkbox } from '../components/ui/Checkbox';
import { ToggleChip } from '../components/ui/ToggleChip';
import { Combobox } from '../components/ui/Combobox';
import {
  LocationSelect,
  DEFAULT_LOCATION,
  type LocationValue,
} from '../components/LocationSelect';
import { NICHE_SUGGESTIONS } from '../lib/niches';
import { useToast } from '../components/Toast';

const QUANTIDADE_OPTIONS = [20, 50, 100, 200, 500];

interface FormState {
  nicho: string;
  location: LocationValue;
  quantidade: number;
  somenteComTelefone: boolean;
  somenteComSite: boolean;
  somenteSemSite: boolean;
  notaMinima: string;
  avaliacoesMinimas: string;
  somenteAbertos: boolean;
  evitarExistentes: boolean;
}

const INITIAL_FORM: FormState = {
  nicho: '',
  location: { ...DEFAULT_LOCATION, estado: 'MT' },
  quantidade: 50,
  somenteComTelefone: false,
  somenteComSite: false,
  somenteSemSite: false,
  notaMinima: '',
  avaliacoesMinimas: '',
  somenteAbertos: false,
  evitarExistentes: false,
};

export function ProspeccaoPage() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProspectResult | null>(null);
  const toast = useToast();

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.nicho.trim()) {
      toast.error('Preencha o nicho');
      return;
    }
    if (!form.location.cidade.trim()) {
      toast.error('Selecione uma cidade');
      return;
    }
    if (form.location.pais === 'Brasil' && !form.location.estado) {
      toast.error('Selecione o estado');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const resposta = await postData<ProspectResult>('/prospeccao', {
        nicho: form.nicho.trim(),
        cidade: form.location.cidade.trim(),
        estado: form.location.estado,
        quantidade: form.quantidade,
        filters: {
          somenteComTelefone: form.somenteComTelefone || undefined,
          somenteComSite: form.somenteComSite || undefined,
          somenteSemSite: form.somenteSemSite || undefined,
          notaMinima: form.notaMinima ? Number(form.notaMinima) : undefined,
          avaliacoesMinimas: form.avaliacoesMinimas ? Number(form.avaliacoesMinimas) : undefined,
          somenteAbertos: form.somenteAbertos || undefined,
          evitarExistentes: form.evitarExistentes || undefined,
        },
      });
      setResult(resposta);
      toast.success('Prospecção concluída');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao prospectar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="workspace-heading">
        <div>
          <p className="workspace-eyebrow">Comercial / Prospecção</p>
          <h2>Prospecção</h2>
          <p>Encontre empresas na Google Places API pelo nicho, país, estado e cidade. Os resultados só viram leads ao serem adicionados ao CRM.</p>
        </div>
      </div>

      <section className="panel">
        <div className="panel-heading">
          <h3 className="flex items-center gap-2"><Crosshair className="h-4 w-4" /> Pesquisar empresas</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="Nicho" required>
            <Combobox
              options={NICHE_SUGGESTIONS}
              value={form.nicho}
              onChange={(v) => set('nicho', v)}
              placeholder="Escolha um nicho ou digite o seu..."
              disabled={loading}
            />
          </Field>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Dica: escolha uma sugestão ou digite qualquer nicho (ex: “clínicas de fisioterapia”). Ajuste
            para plural quando fizer sentido.
          </p>

          <LocationSelect
            value={form.location}
            onChange={(location) => set('location', location)}
            disabled={loading}
            required={{ pais: true, estado: true, cidade: true }}
          />

          <div>
            <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Quantidade desejada
            </span>
            <div className="flex flex-wrap gap-2">
              {QUANTIDADE_OPTIONS.map((q) => (
                <ToggleChip
                  key={q}
                  active={form.quantidade === q}
                  onClick={() => set('quantidade', q)}
                >
                  {q}
                </ToggleChip>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <Sparkles className="h-4 w-4 text-brand-500" />
              Filtros opcionais
            </div>
            <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              <Checkbox
                checked={form.somenteComTelefone}
                onChange={(v) => set('somenteComTelefone', v)}
              >
                Somente com telefone
              </Checkbox>
              <Checkbox checked={form.somenteComSite} onChange={(v) => set('somenteComSite', v)}>
                Somente com site
              </Checkbox>
              <Checkbox checked={form.somenteSemSite} onChange={(v) => set('somenteSemSite', v)}>
                Somente sem site (maior score)
              </Checkbox>
              <Checkbox checked={form.somenteAbertos} onChange={(v) => set('somenteAbertos', v)}>
                Somente empresas ativas
              </Checkbox>
              <Checkbox
                checked={form.evitarExistentes}
                onChange={(v) => set('evitarExistentes', v)}
              >
                Evitar leads já existentes
              </Checkbox>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Field label="Nota mínima" htmlFor="nota-min">
                    <Input
                      id="nota-min"
                      type="number"
                      min={0}
                      max={5}
                      step={0.1}
                      placeholder="4.5"
                      value={form.notaMinima}
                      onChange={(e) => set('notaMinima', e.target.value)}
                      disabled={loading}
                    />
                  </Field>
                </div>
                <div className="flex-1">
                  <Field label="Avaliações mínimas" htmlFor="avaliacoes-min">
                    <Input
                      id="avaliacoes-min"
                      type="number"
                      min={0}
                      placeholder="20"
                      value={form.avaliacoesMinimas}
                      onChange={(e) => set('avaliacoesMinimas', e.target.value)}
                      disabled={loading}
                    />
                  </Field>
                </div>
              </div>
            </div>
          </div>

          <Button type="submit" size="lg" loading={loading} className="w-full sm:w-auto">
            {!loading && <Search className="h-4 w-4" />}
            {loading ? 'Buscando empresas...' : 'PROSPECTAR LEADS'}
          </Button>
        </form>
      </section>

      {loading && (
        <section className="panel">
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <Search className="h-8 w-8 animate-pulse text-brand-500" />
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-100">Buscando empresas...</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Consultando {form.nicho} em {form.location.cidade} {form.location.estado} na Google Places API
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1">
                <Search className="h-3.5 w-3.5" /> Encontrados: —
              </span>
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Novos: —
              </span>
              <span className="inline-flex items-center gap-1">
                <RefreshCcw className="h-3.5 w-3.5" /> Já existentes: —
              </span>
            </div>
          </div>
        </section>
      )}

      {result && !loading && (
        <section className="panel-flush">
          <div className="flex items-center gap-3 border-b border-slate-200 bg-emerald-50 px-5 py-4 dark:border-slate-800 dark:bg-emerald-950/30">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="font-bold text-emerald-800 dark:text-emerald-300">Prospecção concluída</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">{result.campaignName}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{result.encontrados}</div>
              <div className="text-xs font-medium text-slate-500">empresas encontradas</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{result.novos}</div>
              <div className="text-xs font-medium text-slate-500">novos resultados</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-brand-600 dark:text-brand-400">{result.existentes}</div>
              <div className="text-xs font-medium text-slate-500">já estavam no sistema</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-500">{result.filtrados}</div>
              <div className="text-xs font-medium text-slate-500">fora dos filtros</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 border-t border-slate-200 px-5 py-4 dark:border-slate-800">
            <p className="w-full text-xs text-slate-500">Os resultados só entram nas métricas após adicionar ao CRM.</p>
            <Link to={`/leads?campaignId=${result.campaignId}`} className="btn-primary !py-2 text-xs">
              Ver resultados
            </Link>
            <Link to="/campanhas" className="btn-secondary !py-2 text-xs">
              Ver campanhas
            </Link>
          </div>
        </section>
      )}

      <div className="page-note page-note--warn">
        <AlertTriangle className="mt-0.5 h-4 w-4" />
        <p>
          Cada prospecção consome chamadas da Google Places API. Resultados já salvos são reaproveitados e
          não geram chamadas extras ao abrir as telas.
        </p>
      </div>
    </div>
  );
}
