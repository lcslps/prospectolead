export const BR_STATES = [
  { uf: 'AC', name: 'Acre' },
  { uf: 'AL', name: 'Alagoas' },
  { uf: 'AP', name: 'Amapá' },
  { uf: 'AM', name: 'Amazonas' },
  { uf: 'BA', name: 'Bahia' },
  { uf: 'CE', name: 'Ceará' },
  { uf: 'DF', name: 'Distrito Federal' },
  { uf: 'ES', name: 'Espírito Santo' },
  { uf: 'GO', name: 'Goiás' },
  { uf: 'MA', name: 'Maranhão' },
  { uf: 'MT', name: 'Mato Grosso' },
  { uf: 'MS', name: 'Mato Grosso do Sul' },
  { uf: 'MG', name: 'Minas Gerais' },
  { uf: 'PA', name: 'Pará' },
  { uf: 'PB', name: 'Paraíba' },
  { uf: 'PR', name: 'Paraná' },
  { uf: 'PE', name: 'Pernambuco' },
  { uf: 'PI', name: 'Piauí' },
  { uf: 'RJ', name: 'Rio de Janeiro' },
  { uf: 'RN', name: 'Rio Grande do Norte' },
  { uf: 'RS', name: 'Rio Grande do Sul' },
  { uf: 'RO', name: 'Rondônia' },
  { uf: 'RR', name: 'Roraima' },
  { uf: 'SC', name: 'Santa Catarina' },
  { uf: 'SP', name: 'São Paulo' },
  { uf: 'SE', name: 'Sergipe' },
  { uf: 'TO', name: 'Tocantins' },
];

const cityCache = new Map(); // uf -> string[]

export async function fetchCitiesByState(uf) {
  const key = String(uf || '').toUpperCase();
  if (!key) return [];
  if (cityCache.has(key)) return cityCache.get(key);

  const url = `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${key}/municipios`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Falha ao buscar cidades do IBGE (HTTP ${res.status})`);
  const data = await res.json();
  const cities = Array.isArray(data) ? data.map((c) => c.nome).sort((a, b) => a.localeCompare(b, 'pt-BR')) : [];
  cityCache.set(key, cities);
  return cities;
}
