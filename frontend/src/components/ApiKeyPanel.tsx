import { TEXT_MODELS, IMAGE_MODELS } from '../types';
import { Card, Field } from './layout';
import Select from './Select';

interface Props {
  modelText: string;
  setModelText: (v: string) => void;
  modelImage: string;
  setModelImage: (v: string) => void;
}

export default function ApiKeyPanel({ modelText, setModelText, modelImage, setModelImage }: Props) {
  return (
    <Card className="p-5">
      <h2 className="text-[15px] text-[#1a1d21] mb-3">Modelos</h2>

      <div className="space-y-3">
        <Field label="Modelo de texto (geração do site)">
          <Select
            value={modelText}
            onChange={setModelText}
            options={TEXT_MODELS.map((m) => ({ value: m.value, label: m.label }))}
            searchable
            searchPlaceholder="Buscar modelo..."
          />
        </Field>

        <Field label="Modelo de imagem (Cloudflare Workers AI)">
          <Select
            value={modelImage}
            onChange={setModelImage}
            options={IMAGE_MODELS.map((m) => ({ value: m.value, label: m.label }))}
            searchable
            searchPlaceholder="Buscar modelo..."
          />
        </Field>
      </div>
    </Card>
  );
}
