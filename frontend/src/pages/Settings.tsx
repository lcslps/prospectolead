import { useEffect, useState } from 'react';
import { SlidersHorizontal, Save, Info, RotateCcw } from 'lucide-react';
import { getData, putData } from '../services/api';
import type { ScoreWeights } from '../types';
import { PageLoader, EmptyState } from '../components/UI';
import { useToast } from '../components/Toast';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { formatScore } from '../lib/utils';

const DEFAULT_WEIGHTS: ScoreWeights = {
  semSite: 30,
  temTelefone: 20,
  avaliacoesMais20: 15,
  notaQuatroCinco: 15,
  avaliacoesMais50: 10,
  enderecoCompleto: 10,
  max: 100,
};

const WEIGHT_DESCRIPTIONS: Array<{ key: keyof ScoreWeights; label: string; hint: string }> = [
  { key: 'semSite', label: 'Não tem site', hint: 'Somado quando o lead não possui site (mais fácil de converter em atendimento próprio/indicação).' },
  { key: 'temTelefone', label: 'Tem telefone', hint: 'Leads com telefone podem ser contatados diretamente.' },
  { key: 'avaliacoesMais20', label: 'Mais de 20 avaliações', hint: 'Indica negócio com certa movimentação.' },
  { key: 'notaQuatroCinco', label: 'Nota >= 4.5', hint: 'Boa reputação no Google.' },
  { key: 'avaliacoesMais50', label: 'Mais de 50 avaliações', hint: 'Negócio consolidado com forte presença.' },
  { key: 'enderecoCompleto', label: 'Endereço completo', hint: 'Endereço + cidade + CEP preenchidos.' },
  { key: 'max', label: 'Score máximo', hint: 'Limite do score (padrão 100).' },
];

function ScorePreview({ weights }: { weights: ScoreWeights }) {
  const compute = (input: { site?: number; telefone?: string; avaliacoes?: number; nota?: number }) => {
    let score = 0;
    if (!input.site) score += weights.semSite;
    if (input.telefone) score += weights.temTelefone;
    if ((input.avaliacoes ?? 0) > 20) score += weights.avaliacoesMais20;
    if ((input.nota ?? 0) >= 4.5) score += weights.notaQuatroCinco;
    if ((input.avaliacoes ?? 0) > 50) score += weights.avaliacoesMais50;
    return Math.min(score, weights.max);
  };

  const second = compute({
    telefone: '(66) 9999',
    avaliacoes: 30,
    nota: 4.8,
    site: 0,
  });

  const display = (score: number) => {
    const f = formatScore(score);
    return `${score} · ${f.label}`;
  };

  return (
    <div className="mt-4 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-800/50">
      <p className="font-semibold text-slate-700 dark:text-slate-200">Prévia com os pesos atuais</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="rounded-md bg-white p-3 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
          <span className="block text-xs text-slate-400">Lead com site, sem telefone, 5 avaliações, nota 3.5</span>
          <span className="font-bold">{display(compute({ site: 1, avaliacoes: 5, nota: 3.5 }))}</span>
        </div>
        <div className="rounded-md bg-white p-3 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
          <span className="block text-xs text-slate-400">Sem site, com telefone, 30 avaliações, nota 4.8</span>
          <span className="font-bold">{display(second)}</span>
        </div>
      </div>
    </div>
  );
}

export function SettingsPage() {
  const [weights, setWeights] = useState<ScoreWeights | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    getData<{ leadScore: ScoreWeights }>('/settings')
      .then((data) => setWeights(data.leadScore))
      .catch((e: Error) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [toast]);

  const setWeight = (key: keyof ScoreWeights, value: string) => {
    if (!weights) return;
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return;
    setWeights({ ...weights, [key]: Math.max(0, Math.min(100, parsed)) });
  };

  const resetDefaults = () => setWeights({ ...DEFAULT_WEIGHTS });

  const save = async () => {
    if (!weights) return;
    setSaving(true);
    try {
      await putData<{ leadScore: ScoreWeights }>('/settings', weights);
      toast.success('Configurações salvas');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!weights) return <EmptyState title="Não foi possível carregar configurações" />;

  return (
    <div className="page">
      <div className="workspace-heading">
        <div>
          <p className="workspace-eyebrow">Configurações</p>
          <h2>Configurações</h2>
          <p>Altere os pesos do cálculo de score (0 a 100). Os novos valores valem para novas prospecções.</p>
        </div>
      </div>

      <section className="panel">
        <div className="panel-heading">
          <h3 className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4" /> Lead score</h3>
        </div>

        <div className="space-y-4">
          {WEIGHT_DESCRIPTIONS.map((item) => (
            <div key={item.key} className="flex items-center justify-between gap-4">
              <div>
                <label className="text-sm font-medium text-slate-800 dark:text-slate-100">{item.label}</label>
                <p className="text-xs text-slate-500 dark:text-slate-400">{item.hint}</p>
              </div>
              {item.key === 'max' ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">máximo</span>
                  <Input
                    className="!w-20 text-center"
                    type="number"
                    value={weights.max}
                    onChange={(e) => setWeight('max', e.target.value)}
                  />
                </div>
              ) : (
                <Input
                  className="!w-24 text-center"
                  type="number"
                  value={weights[item.key]}
                  onChange={(e) => setWeight(item.key, e.target.value)}
                />
              )}
            </div>
          ))}

          <ScorePreview weights={weights} />

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={resetDefaults}>
              <RotateCcw className="h-4 w-4" /> Restaurar padrão
            </Button>
            <Button onClick={save} loading={saving}>
              {!saving && <Save className="h-4 w-4" />}
              Salvar configurações
            </Button>
          </div>
        </div>
      </section>

      <div className="page-note">
        <Info className="mt-0.5 h-4 w-4" />
        <p>
          O score é calculado no <strong>serviço LeadScoreService</strong> no backend, sempre que um lead é
          criado ou atualizado pela prospecção. Alterações aqui também são lidas pelo serviço (cache é
          atualizado a cada minuto).
        </p>
      </div>
    </div>
  );
}