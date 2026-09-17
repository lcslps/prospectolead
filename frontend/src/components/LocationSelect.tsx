import { useEffect, useState } from 'react';
import { Field } from './ui/Field';
import { Input } from './ui/Input';
import { Select } from './ui/Select';

export interface LocationValue {
  pais: string;
  estado: string;
  cidade: string;
}

export const DEFAULT_LOCATION: LocationValue = { pais: 'Brasil', estado: '', cidade: '' };

export const COUNTRIES = [
  'Brasil',
  'Portugal',
  'Estados Unidos',
  'Canadá',
  'México',
  'Argentina',
  'Chile',
  'Uruguai',
  'Paraguai',
  'Bolívia',
  'Peru',
  'Colômbia',
  'Venezuela',
  'Equador',
  'Espanha',
  'França',
  'Itália',
  'Alemanha',
  'Reino Unido',
  'Japão',
  'Austrália',
];

const FALLBACK_STATES: Array<{ sigla: string; nome: string }> = [
  { sigla: 'AC', nome: 'Acre' },
  { sigla: 'AL', nome: 'Alagoas' },
  { sigla: 'AP', nome: 'Amapá' },
  { sigla: 'AM', nome: 'Amazonas' },
  { sigla: 'BA', nome: 'Bahia' },
  { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'DF', nome: 'Distrito Federal' },
  { sigla: 'ES', nome: 'Espírito Santo' },
  { sigla: 'GO', nome: 'Goiás' },
  { sigla: 'MA', nome: 'Maranhão' },
  { sigla: 'MT', nome: 'Mato Grosso' },
  { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' },
  { sigla: 'PA', nome: 'Pará' },
  { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'PR', nome: 'Paraná' },
  { sigla: 'PE', nome: 'Pernambuco' },
  { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' },
  { sigla: 'RN', nome: 'Rio Grande do Norte' },
  { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'RO', nome: 'Rondônia' },
  { sigla: 'RR', nome: 'Roraima' },
  { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SP', nome: 'São Paulo' },
  { sigla: 'SE', nome: 'Sergipe' },
  { sigla: 'TO', nome: 'Tocantins' },
];

const IBGE_STATES_URL = 'https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome';
const IBGE_CITIES_URL = (uf: string) =>
  `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`;

interface IbgeEstado {
  sigla: string;
  nome: string;
}

export function LocationSelect({
  value,
  onChange,
  required = { pais: true, estado: false, cidade: true },
  disabled,
}: {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
  required?: { pais?: boolean; estado?: boolean; cidade?: boolean };
  disabled?: boolean;
}) {
  const [states, setStates] = useState<IbgeEstado[] | null>(null);
  const [statesLoading, setStatesLoading] = useState(false);
  const [statesError, setStatesError] = useState(false);
  const [cities, setCities] = useState<string[] | null>(null);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [citiesError, setCitiesError] = useState(false);

  const isBrazil = value.pais === 'Brasil';

  useEffect(() => {
    if (!isBrazil) {
      setStates(null);
      setCities(null);
      return;
    }
    let active = true;
    setStatesLoading(true);
    setStatesError(false);
    fetch(IBGE_STATES_URL)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data: IbgeEstado[]) => {
        if (active) setStates(data.length > 0 ? data : FALLBACK_STATES);
      })
      .catch(() => {
        if (active) {
          setStates(FALLBACK_STATES);
          setStatesError(true);
        }
      })
      .finally(() => {
        if (active) setStatesLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isBrazil]);

  useEffect(() => {
    if (!isBrazil || !value.estado) {
      setCities(null);
      return;
    }
    let active = true;
    setCitiesLoading(true);
    setCitiesError(false);
    setCities(null);
    fetch(IBGE_CITIES_URL(value.estado))
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data: Array<{ nome: string }>) => {
        if (active) setCities(data.map((c) => c.nome));
      })
      .catch(() => {
        if (active) setCitiesError(true);
      })
      .finally(() => {
        if (active) setCitiesLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isBrazil, value.estado]);

  const handlePais = (pais: string) => {
    onChange({ pais, estado: '', cidade: '' });
  };

  const handleEstado = (estado: string) => {
    onChange({ ...value, estado, cidade: '' });
  };

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
      <div className="sm:col-span-1">
        <Field label="País" htmlFor="loc-pais" required={required.pais}>
          <Select
            id="loc-pais"
            value={value.pais}
            onChange={(e) => handlePais(e.target.value)}
            disabled={disabled}
          >
            {COUNTRIES.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {isBrazil ? (
        <>
          <div className="sm:col-span-1">
            <Field
              label="Estado"
              htmlFor="loc-estado"
              required={required.estado ?? true}
              hint={statesError ? 'Lista offline (UFs)' : undefined}
            >
              <Select
                id="loc-estado"
                value={value.estado}
                onChange={(e) => handleEstado(e.target.value)}
                disabled={disabled || statesLoading}
                loading={statesLoading}
              >
                <option value="">Selecione o estado...</option>
                {(states ?? []).map((state) => (
                  <option key={state.sigla} value={state.sigla}>
                    {state.sigla} · {state.nome}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field label="Cidade" htmlFor="loc-cidade" required={required.cidade}>
              {citiesError ? (
                <Input
                  id="loc-cidade"
                  placeholder="Digite a cidade..."
                  value={value.cidade}
                  onChange={(e) => onChange({ ...value, cidade: e.target.value })}
                  disabled={disabled}
                />
              ) : (
                <Select
                  id="loc-cidade"
                  value={value.cidade}
                  onChange={(e) => onChange({ ...value, cidade: e.target.value })}
                  disabled={disabled || !value.estado || citiesLoading}
                  loading={citiesLoading}
                >
                  <option value="">
                    {!value.estado
                      ? 'Selecione o estado primeiro'
                      : citiesLoading
                        ? 'Carregando cidades...'
                        : 'Selecione a cidade...'}
                  </option>
                  {(cities ?? []).map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </div>
        </>
      ) : (
        <>
          <div className="sm:col-span-1">
            <Field label="Estado / Região" htmlFor="loc-intl-estado" required={required.estado}>
              <Input
                id="loc-intl-estado"
                placeholder="Ex: New York"
                value={value.estado}
                onChange={(e) => onChange({ ...value, estado: e.target.value })}
                disabled={disabled}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Cidade" htmlFor="loc-intl-cidade" required={required.cidade}>
              <Input
                id="loc-intl-cidade"
                placeholder="Digite a cidade..."
                value={value.cidade}
                onChange={(e) => onChange({ ...value, cidade: e.target.value })}
                disabled={disabled}
              />
            </Field>
          </div>
        </>
      )}
    </div>
  );
}