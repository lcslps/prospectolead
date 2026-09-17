import type { GooglePlace } from './GooglePlacesService';
import { normalizePhoneBr } from '../utils/phone';

const CATEGORY_MAP: Record<string, string> = {
  dentist: 'Dentista',
  barber_shop: 'Barbearia',
  beauty_salon: 'Salão de beleza',
  hair_care: 'Cabeleireiro',
  restaurant: 'Restaurante',
  cafe: 'Café',
  bakery: 'Padaria',
  gym: 'Academia',
  auto_repair: 'Oficina mecânica',
  car_dealer: 'Concessionária',
  electronics_store: 'Loja de eletrônicos',
  clothing_store: 'Loja de roupas',
  shoe_store: 'Loja de calçados',
  furniture_store: 'Loja de móveis',
  hardware_store: 'Loja de ferramentas',
  pharmacy: 'Farmácia',
  hospital: 'Hospital',
  doctor: 'Clínica médica',
  physiotherapist: 'Fisioterapia',
  lawyer: 'Advocacia',
  accounting: 'Contabilidade',
  real_estate_agency: 'Imobiliária',
  insurance_agency: 'Corretora de seguros',
  travel_agency: 'Agência de viagens',
  plumber: 'Encanador',
  electrician: 'Eletricista',
  general_contractor: 'Construtor',
  painter: 'Pintor',
  florist: 'Floricultura',
  pet_store: 'Pet shop',
  veterinary_care: 'Veterinário',
  school: 'Escola',
  university: 'Universidade',
  lodging: 'Hospedagem',
  hotel: 'Hotel',
  supermarket: 'Supermercado',
  gas_station: 'Posto de combustível',
  car_wash: 'Lava-rápido',
  spa: 'Spa',
  nail_salon: 'Estúdio de unhas',
  movie_theater: 'Cinema',
  night_club: 'Balada',
  park: 'Parque',
  bank: 'Banco',
  post_office: 'Correios',
  church: 'Igreja',
  stadium: 'Estádio',
  store: 'Loja',
  food: 'Alimentação',
  health: 'Saúde',
  beauty_salon_tanning_salon: 'Estética',
  local_government_office: 'Órgão público',
  home_styles_and_stores: 'Loja de casa',
  administrative_area_level_1: '',
  country: '',
  locality: '',
  political: '',
};

function humanize(types?: string[]): string | null {
  if (!types || types.length === 0) return null;

  for (const type of types) {
    const mapped = CATEGORY_MAP[type];
    if (type === 'establishment' || type === 'point_of_interest') continue;
    if (mapped) return mapped;
  }

  for (const type of types) {
    if (type === 'establishment' || type === 'point_of_interest' || type === 'food' || type === 'health') {
      continue;
    }
    return type
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  return null;
}

interface AddressParts {
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
}

function extractAddress(place: GooglePlace): AddressParts {
  const parts: AddressParts = {};
  const components = place.addressComponents ?? [];

  for (const component of components) {
    const types = component.types ?? [];
    if (types.includes('locality') || types.includes('sublocality_level_1')) {
      parts.cidade = component.longText;
    }
    if (types.includes('administrative_area_level_1')) {
      parts.estado = component.shortText || component.longText;
    }
    if (types.includes('postal_code')) {
      parts.cep = component.longText;
    }
  }

  parts.endereco = place.formattedAddress;
  return parts;
}

export interface LeadDataInput {
  googlePlaceId: string;
  nome: string;
  categoria?: string | null;
  nicho?: string | null;
  endereco?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  telefone?: string | null;
  telefoneInternacional?: string | null;
  site?: string | null;
  googleMapsUrl?: string | null;
  nota?: number | null;
  quantidadeAvaliacoes?: number | null;
  businessStatus?: string | null;
  leadScore?: number | null;
}

export function mapPlaceToLeadData(place: GooglePlace, nicho: string): LeadDataInput {
  const address = extractAddress(place);
  const phones = normalizePhoneBr(place.nationalPhoneNumber, place.internationalPhoneNumber);

  return {
    googlePlaceId: place.id,
    nome: place.displayName?.text ?? 'Sem nome',
    categoria: humanize(place.types),
    nicho,
    endereco: address.endereco ?? null,
    cidade: address.cidade ?? null,
    estado: address.estado ?? null,
    cep: address.cep ?? null,
    latitude: place.location?.latitude ?? null,
    longitude: place.location?.longitude ?? null,
    telefone: phones.national,
    telefoneInternacional: phones.international,
    site: place.websiteUri || null,
    googleMapsUrl: place.googleMapsUri || null,
    nota: place.rating ?? null,
    quantidadeAvaliacoes: place.userRatingCount ?? null,
    businessStatus: place.businessStatus ?? null,
  };
}