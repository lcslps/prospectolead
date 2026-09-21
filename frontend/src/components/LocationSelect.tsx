import { useEffect, useState } from 'react';
import { Field } from './ui/Field';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { getData } from '../services/api';

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

const COUNTRY_CODES: Record<string, string> = {
  Brasil: 'BR',
  Portugal: 'PT',
  'Estados Unidos': 'US',
  'Canadá': 'CA',
  'México': 'MX',
  Argentina: 'AR',
  Chile: 'CL',
  Uruguai: 'UY',
  Paraguai: 'PY',
  'Bolívia': 'BO',
  Peru: 'PE',
  'Colômbia': 'CO',
  Venezuela: 'VE',
  Equador: 'EC',
  Espanha: 'ES',
  'França': 'FR',
  'Itália': 'IT',
  Alemanha: 'DE',
  'Reino Unido': 'GB',
  'Japão': 'JP',
  'Austrália': 'AU',
};

const FALLBACK_STATES: Array<{ code: string; name: string }> = [
  { code: 'AC', name: 'Acre' },
  { code: 'AL', name: 'Alagoas' },
  { code: 'AP', name: 'Amapá' },
  { code: 'AM', name: 'Amazonas' },
  { code: 'BA', name: 'Bahia' },
  { code: 'CE', name: 'Ceará' },
  { code: 'DF', name: 'Distrito Federal' },
  { code: 'ES', name: 'Espírito Santo' },
  { code: 'GO', name: 'Goiás' },
  { code: 'MA', name: 'Maranhão' },
  { code: 'MT', name: 'Mato Grosso' },
  { code: 'MS', name: 'Mato Grosso do Sul' },
  { code: 'MG', name: 'Minas Gerais' },
  { code: 'PA', name: 'Pará' },
  { code: 'PB', name: 'Paraíba' },
  { code: 'PR', name: 'Paraná' },
  { code: 'PE', name: 'Pernambuco' },
  { code: 'PI', name: 'Piauí' },
  { code: 'RJ', name: 'Rio de Janeiro' },
  { code: 'RN', name: 'Rio Grande do Norte' },
  { code: 'RS', name: 'Rio Grande do Sul' },
  { code: 'RO', name: 'Rondônia' },
  { code: 'RR', name: 'Roraima' },
  { code: 'SC', name: 'Santa Catarina' },
  { code: 'SP', name: 'São Paulo' },
  { code: 'SE', name: 'Sergipe' },
  { code: 'TO', name: 'Tocantins' },
];

const IBGE_STATES_URL = 'https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome';
const IBGE_CITIES_URL = (uf: string) =>
  `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`;

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
  const [states, setStates] = useState<Array<{ code: string; name: string }> | null>(null);
  const [statesLoading, setStatesLoading] = useState(false);
  const [statesError, setStatesError] = useState(false);
  const [cities, setCities] = useState<string[] | null>(null);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [citiesError, setCitiesError] = useState(false);

  const isBrazil = value.pais === 'Brasil';
  const countryCode = COUNTRY_CODES[value.pais] ?? '';

  useEffect(() => {
    if (!isBrazil && !countryCode) return;
    let active = true;
    setStatesLoading(true);
    setStatesError(false);
    setStates(null);
    setCities(null);
    if (isBrazil) {
      fetch(IBGE_STATES_URL)
        .then((res) => {
          if (!res.ok) throw new Error();
          return res.json();
        })
        .then((data: Array<{ sigla: string; nome: string }>) => {
          if (active) setStates(data.length > 0 ? data.map((s) => ({ code: s.sigla, name: s.nome })) : FALLBACK_STATES);
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
    } else {
      getData<{ states: Array<{ code: string; name: string }> }>('/location/states', { country: countryCode })
        .then((data) => {
          if (active) setStates(data.states);
        })
        .catch(() => {
          if (active) setStatesError(true);
        })
        .finally(() => {
          if (active) setStatesLoading(false);
        });
    }
    return () => {
      active = false;
    };
  }, [isBrazil, countryCode]);

  useEffect(() => {
    if (!value.estado) {
      setCities(null);
      return;
    }
    let active = true;
    setCitiesLoading(true);
    setCitiesError(false);
    setCities(null);
    if (isBrazil) {
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
    } else {
      getData<{ cities: string[] }>('/location/cities', { country: countryCode, state: value.estado })
        .then((data) => {
          if (active) setCities(data.cities);
        })
        .catch(() => {
          if (active) setCitiesError(true);
        })
        .finally(() => {
          if (active) setCitiesLoading(false);
        });
    }
    return () => {
      active = false;
    };
  }, [isBrazil, countryCode, value.estado]);

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

      <div className="sm:col-span-1">
        <Field
          label={isBrazil ? 'Estado' : 'Estado / Região'}
          htmlFor="loc-estado"
          required={required.estado ?? true}
          hint={statesError ? 'Lista indisponível — digite manualmente.' : undefined}
        >
          {statesError ? (
            <Input
              id="loc-estado"
              placeholder={isBrazil ? 'Ex.: MT' : 'Ex.: NY'}
              value={value.estado}
              onChange={(e) => handleEstado(e.target.value)}
              disabled={disabled}
            />
          ) : (
            <Select
              id="loc-estado"
              value={value.estado}
              onChange={(e) => handleEstado(e.target.value)}
              disabled={disabled || statesLoading}
              loading={statesLoading}
            >
              <option value="">Selecione o estado...</option>
              {(states ?? []).map((state) => (
                <option key={state.code} value={state.code}>
                  {isBrazil ? `${state.code} · ${state.name}` : state.name}
                </option>
              ))}
            </Select>
          )}
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
    </div>
  );
}