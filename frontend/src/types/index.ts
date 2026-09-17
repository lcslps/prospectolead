export type LeadStatus =
  | 'NOVO'
  | 'CONTATADO'
  | 'RESPONDEU'
  | 'INTERESSADO'
  | 'NEGOCIACAO'
  | 'CLIENTE'
  | 'IGNORADO';

export const LEAD_STATUSES: LeadStatus[] = [
  'NOVO',
  'CONTATADO',
  'RESPONDEU',
  'INTERESSADO',
  'NEGOCIACAO',
  'CLIENTE',
  'IGNORADO',
];

export interface Lead {
  id: string;
  googlePlaceId: string;
  nome: string;
  categoria: string | null;
  nicho: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  latitude: number | null;
  longitude: number | null;
  telefone: string | null;
  telefoneInternacional: string | null;
  site: string | null;
  googleMapsUrl: string | null;
  nota: number | null;
  quantidadeAvaliacoes: number | null;
  businessStatus: string | null;
  status: LeadStatus;
  observacoes: string | null;
  leadScore: number;
  source: string;
  lastEnrichedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  crmStage?: CrmStage | null;
  crmLeadId?: string | null;
}

export type CrmStage =
  | 'NEW'
  | 'SITE_GENERATED'
  | 'MESSAGE_SENT'
  | 'REPLIED'
  | 'INTERESTED'
  | 'NEGOTIATION'
  | 'CLIENT'
  | 'LOST';

export const CRM_STAGES: CrmStage[] = [
  'NEW',
  'SITE_GENERATED',
  'MESSAGE_SENT',
  'REPLIED',
  'INTERESTED',
  'NEGOTIATION',
  'CLIENT',
  'LOST',
];

export type CrmActivityType =
  | 'ADDED_TO_CRM'
  | 'MESSAGE_SENT'
  | 'STAGE_CHANGED'
  | 'NOTE_ADDED'
  | 'FOLLOW_UP_CREATED'
  | 'WHATSAPP_OPENED'
  | 'CLIENT_WON'
  | 'LOST';

export interface CrmActivity {
  id: string;
  crmLeadId: string;
  type: CrmActivityType;
  description: string;
  createdAt: string;
}

export interface CrmLeadFull {
  website?: { id: string; status: string; generationStatus: string } | null;
  id: string;
  leadId: string;
  stage: CrmStage;
  position: number;
  notes: string | null;
  lastContactAt: string | null;
  nextFollowUpAt: string | null;
  createdAt: string;
  updatedAt: string;
  lead: LeadDetail;
  activities?: CrmActivity[];
}

export interface CrmStats {
  leadsNoCrm: number;
  novas: number;
  mensagensEnviadas: number;
  responderam: number;
  interessados: number;
  negociacao: number;
  clientes: number;
  perdidos: number;
  taxaResposta: number;
  taxaConversao: number;
  porStage: Record<string, number>;
}

export interface CRMBoardData {
  leads: CrmLeadFull[];
  stats: CrmStats;
}

export interface CrmAddResult {
  crmLead: CrmLeadFull;
  created: boolean;
  alreadyInCrm: boolean;
}

export interface CrmBulkResult {
  total: number;
  added: number;
  skipped: number;
}

export interface Campaign {
  id: string;
  nome: string;
  nicho: string;
  cidade: string;
  estado: string;
  quantidadeSolicitada: number;
  quantidadeEncontrada: number;
  createdAt: string;
  updatedAt: string;
  _count?: { leads: number };
}

export interface CampaignLeadLink {
  leadId: string;
  campaignId: string;
  campaign: Pick<
    Campaign,
    'id' | 'nome' | 'nicho' | 'cidade' | 'estado' | 'quantidadeSolicitada' | 'quantidadeEncontrada' | 'createdAt'
  >;
}

export interface LeadDetail extends Lead {
  campaigns: CampaignLeadLink[];
}

export interface MessageTemplate {
  id: string;
  nome: string;
  conteudo: string;
  servico: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PagedLeads {
  items: Lead[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ProspectResult {
  campaignId: string;
  encontrados: number;
  novos: number;
  existentes: number;
  filtrados: number;
  salvos: number;
  campaignName: string;
}

export type ScoreWeights = {
  semSite: number;
  temTelefone: number;
  avaliacoesMais20: number;
  notaQuatroCinco: number;
  avaliacoesMais50: number;
  enderecoCompleto: number;
  max: number;
};

export interface DashboardData {
  stats: {
    totalLeads: number;
    novos: number;
    contatados: number;
    responderam: number;
    interessados: number;
    negociacao: number;
    clientes: number;
    ignorado: number;
    campanhas: number;
    leadsHoje: number;
    sitesGerados: number;
  };
  crmStats?: {
    leadsNoCrm: number;
    novas: number;
    mensagensEnviadas: number;
    responderam: number;
    interessados: number;
    clientes: number;
    atividadesMensagemEnviada: number;
    porStage: Record<string, number>;
  };
  porStatus: Array<{ status: LeadStatus; _count: { _all: number } }>;
  porCidade: Array<{ cidade: string; _count: { _all: number } }>;
  topNichos: Array<{ nicho: string; _count: { _all: number } }>;
  ultimosLeads: Array<{
    id: string;
    nome: string;
    cidade: string | null;
    estado: string | null;
    status: LeadStatus;
    leadScore: number;
    nota: number | null;
    telefone: string | null;
    createdAt: string;
  }>;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
  details?: unknown;
}