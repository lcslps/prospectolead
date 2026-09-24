import { Rocket } from 'lucide-react';
import { NICHES } from '../types';
import type { BusinessFormData, LogEntry } from '../types';
import { Card, Field, inputClassName } from './layout';
import Select from './Select';

interface Props {
  data: BusinessFormData;
  setData: (d: BusinessFormData) => void;
  onGenerate: () => void;
  generating: boolean;
  status: string;
  logs: LogEntry[];
  referenceUrl: string;
  setReferenceUrl: (value: string) => void;
  generateLabel?: string;
}

const logColor: Record<LogEntry['kind'], string> = {
  ok: 'text-[#0e7c5b]',
  go: 'text-[#2f5fe0]',
  err: 'text-[#d64545]',
  muted: 'text-[#5f6570]',
};

const inputClass = 'w-full ' + inputClassName;

export default function BusinessForm({
  data,
  setData,
  onGenerate,
  generating,
  status,
  logs,
  referenceUrl,
  setReferenceUrl,
  generateLabel = 'Gerar site',
}: Props) {
  function set<K extends keyof BusinessFormData>(key: K, value: BusinessFormData[K]) {
    setData({ ...data, [key]: value });
  }

  return (
    <Card className="p-5 mt-4.5">
      <h2 className="text-[15px] text-[#1a1d21] mb-0.5">Dados do negócio</h2>
      <p className="text-[#5f6570] text-[12.5px] leading-relaxed mb-3.5">Quanto mais detalhe você der, melhor fica o site.</p>

      <Field label="Nome da empresa / marca">
        <input
          type="text"
          value={data.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="Ex: Casa Nova Imóveis"
          className={inputClass}
        />
      </Field>

      <Field label="Ramo de atuação">
        <Select
          value={data.niche}
          onChange={(v) => set('niche', v)}
          options={NICHES.map((n) => ({ value: n.label, label: n.label }))}
          searchable
          searchPlaceholder="Buscar ou digitar ramo..."
          creatable
        />
      </Field>

      <Field label="Descrição curta do negócio">
        <textarea
          value={data.desc}
          onChange={(e) => set('desc', e.target.value)}
          placeholder="O que a empresa vende, para quem, e o que a torna especial."
          className={inputClass + ' min-h-[70px] resize-y leading-relaxed'}
        />
      </Field>

      <Field label="Diferenciais / provas sociais (uma por linha)">
        <textarea
          value={data.perks}
          onChange={(e) => set('perks', e.target.value)}
          placeholder={'Ex:\n+700 clientes atendidos\nEntrega em até 40 minutos\nNota 4.9 no Google'}
          className={inputClass + ' min-h-[70px] resize-y leading-relaxed'}
        />
      </Field>

      <Field label="Texto do botão principal (CTA)">
        <input
          type="text"
          value={data.cta}
          onChange={(e) => set('cta', e.target.value)}
          placeholder="Ex: Agendar visita, Pedir agora, Solicitar orçamento"
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-2 gap-2.5">
        <Field label="WhatsApp / telefone">
          <input
            type="text"
            value={data.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="(11) 99999-9999"
            className={inputClass}
          />
        </Field>
        <Field label="Cidade / região">
          <input
            type="text"
            value={data.city}
            onChange={(e) => set('city', e.target.value)}
            placeholder="São Paulo, SP"
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Paleta de cores (opcional)">
        <input
          type="text"
          value={data.colors}
          onChange={(e) => set('colors', e.target.value)}
          placeholder="Ex: preto, dourado e branco / azul e laranja"
          className={inputClass}
        />
      </Field>

      <Field label="Referência visual (opcional)">
        <input
          type="url"
          value={referenceUrl}
          onChange={(e) => setReferenceUrl(e.target.value)}
          placeholder="Pinterest, Behance, Refero, Inspora ou Framer"
          className={inputClass}
        />
      </Field>

      <button
        onClick={onGenerate}
        disabled={generating}
        className="w-full mt-4.5 py-3.5 rounded-xl text-[14.5px] font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm disabled:opacity-50 disabled:hover:bg-blue-600 disabled:cursor-not-allowed"
      >
        {generating ? (
          'Gerando...'
        ) : (
          <span className="inline-flex items-center justify-center gap-2">
            <Rocket size={16} strokeWidth={2.25} /> {generateLabel}
          </span>
        )}
      </button>

      {status && <div className="mt-3.5 text-[12px] text-[#5f6570]">{status}</div>}

      {logs.length > 0 && (
        <div className="mt-2.5 border border-[#e4e7ec] rounded-[10px] bg-[#f7f8fa] px-3 py-2.5 max-h-[190px] overflow-y-auto text-[12px] leading-[1.9]">
          {logs.map((l, i) => (
            <div key={`${l.id}-${i}`} className={logColor[l.kind]}>
              {l.text}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
