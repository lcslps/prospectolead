import { TEXT_MODELS, IMAGE_MODELS } from '../types';
import { Card, Field, inputClassName } from './layout';

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
          <select
            value={modelText}
            onChange={(e) => setModelText(e.target.value)}
            className={'w-full ' + inputClassName}
          >
            {TEXT_MODELS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Modelo de imagem (Cloudflare Workers AI)">
          <select
            value={modelImage}
            onChange={(e) => setModelImage(e.target.value)}
            className={'w-full ' + inputClassName}
          >
            {IMAGE_MODELS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </Card>
  );
}
