import { NICHES, DEFAULT_SECTIONS } from '../types';
import type { BusinessFormData, LogEntry } from '../types';

interface Props {
  data: BusinessFormData;
  setData: (d: BusinessFormData) => void;
  onGenerate: () => void;
  generating: boolean;
  status: string;
  logs: LogEntry[];
}

const logColor: Record<LogEntry['kind'], string> = {
  ok: 'text-[#7ee0c3]',
  go: 'text-[#5b8cff]',
  err: 'text-[#ff6b6b]',
  muted: 'text-[#9aa0ab]',
};

export default function BusinessForm({ data, setData, onGenerate, generating, status, logs }: Props) {
  function set<K extends keyof BusinessFormData>(key: K, value: BusinessFormData[K]) {
    setData({ ...data, [key]: value });
  }

  function toggleSection(section: string) {
    const has = data.sections.includes(section);
    set('sections', has ? data.sections.filter((s) => s !== section) : [...data.sections, section]);
  }

  return (
    <div className="bg-gradient-to-b from-[#16181d] to-[#1d2027] border border-[#2a2d35] rounded-[14px] p-5 mt-4.5">
      <h2 className="text-[15px] text-[#eef0f3] mb-0.5">Dados do negócio</h2>
      <p className="text-[#9aa0ab] text-[12.5px] leading-relaxed mb-3.5">Quanto mais detalhe você der, melhor fica o site.</p>

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
        <select value={data.niche} onChange={(e) => set('niche', e.target.value)} className={inputClass}>
          {NICHES.map((n) => (
            <option key={n.value} value={n.label}>
              {n.label}
            </option>
          ))}
        </select>
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

      <label className="block text-[12.5px] text-[#9aa0ab] font-medium mt-3.5 mb-1.5">Seções que o site deve ter</label>
      <div className="flex flex-wrap gap-2 mt-1.5">
        {DEFAULT_SECTIONS.map((s) => {
          const active = data.sections.includes(s);
          return (
            <button
              key={s}
              type="button"
              onClick={() => toggleSection(s)}
              className={
                'border rounded-full px-3 py-1.5 text-[12.5px] transition-colors ' +
                (active
                  ? 'bg-[#5b8cff26] border-[#5b8cff] text-[#cddcff]'
                  : 'border-[#2a2d35] text-[#9aa0ab]')
              }
            >
              {s}
            </button>
          );
        })}
      </div>

      <button
        onClick={onGenerate}
        disabled={generating}
        className="w-full mt-4.5 py-3.5 rounded-xl text-[14.5px] font-bold text-white bg-gradient-to-br from-[#5b8cff] to-[#7c6bff] shadow-[0_8px_24px_-8px_rgba(91,140,255,0.6)] disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
      >
        {generating ? 'Gerando...' : '✨ Gerar site'}
      </button>

      {status && <div className="mt-3.5 text-[12px] text-[#9aa0ab]">{status}</div>}

      {logs.length > 0 && (
        <div className="mt-2.5 border border-[#2a2d35] rounded-[10px] bg-[#0b0c0f] px-3 py-2.5 max-h-[190px] overflow-y-auto text-[12px] leading-[1.9]">
          {logs.map((l) => (
            <div key={l.id} className={logColor[l.kind]}>
              {l.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const inputClass =
  'w-full bg-[#0f1114] border border-[#2a2d35] focus:border-[#5b8cff] rounded-[10px] px-3 py-2.5 text-[13.5px] text-[#eef0f3] outline-none font-inherit';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-3.5 first:mt-0">
      <label className="block text-[12.5px] text-[#9aa0ab] font-medium mb-1.5">{label}</label>
      {children}
    </div>
  );
}
