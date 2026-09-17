import { z } from 'zod';

z.setErrorMap((issue, ctx) => {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      if (issue.received === 'undefined') {
        return { message: 'é obrigatório' };
      }
      return { message: `tipo inválido (esperado ${issue.expected}, recebido ${issue.received})` };
    case z.ZodIssueCode.too_small: {
      const label = 'minimum' in issue ? String(issue.minimum) : '';
      return { message: `deve ter pelo menos ${label}` };
    }
    case z.ZodIssueCode.too_big: {
      const label = 'maximum' in issue ? String(issue.maximum) : '';
      return { message: `deve ser no máximo ${label}` };
    }
    default:
      return { message: ctx.defaultError };
  }
});

export function optionalQueryBoolean() {
  return z
    .union([z.boolean(), z.literal('true'), z.literal('false'), z.literal('1'), z.literal('0')])
    .optional()
    .transform((v) => (v === undefined ? undefined : typeof v === 'boolean' ? v : v === 'true' || v === '1'));
}

export function optionalQueryNumber() {
  return z.coerce.number().optional();
}

export const CRM_STAGES = [
  'NEW',
  'SITE_GENERATED',
  'MESSAGE_SENT',
  'REPLIED',
  'INTERESTED',
  'NEGOTIATION',
  'CLIENT',
  'LOST',
] as const;

export const CRM_ACTIVITY_TYPES = [
  'ADDED_TO_CRM',
  'MESSAGE_SENT',
  'STAGE_CHANGED',
  'NOTE_ADDED',
  'FOLLOW_UP_CREATED',
  'WHATSAPP_OPENED',
  'CLIENT_WON',
  'LOST',
] as const;

const crmStageEnum = z.enum(CRM_STAGES);

const crmFiltersQuerySchema = z.object({
  query: z.object({
    search: z.string().trim().max(120).optional(),
    cidade: z.string().trim().max(80).optional(),
    nicho: z.string().trim().max(120).optional(),
    estado: z.string().trim().max(8).optional(),
    scoreMin: optionalQueryNumber(),
    comTelefone: optionalQueryBoolean(),
    semTelefone: optionalQueryBoolean(),
    comSite: optionalQueryBoolean(),
    semSite: optionalQueryBoolean(),
    followUpToday: optionalQueryBoolean(),
    followUpLate: optionalQueryBoolean(),
  }),
});

const crmAddSchema = z.object({
  body: z.object({
    leadId: z.string().min(1).max(64),
  }),
});

const crmBulkAddSchema = z.object({
  body: z.object({
    ids: z.array(z.string().min(1).max(64)).min(1).max(500),
  }),
});

const crmLeadParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1).max(64),
  }),
});

const crmPatchSchema = z.object({
  body: z.object({
    notes: z.string().max(5000).nullable().optional(),
    lastContactAt: z.string().datetime({ offset: true }).nullable().optional(),
  }),
});

const crmStagePatchSchema = z.object({
  body: z.object({
    stage: crmStageEnum,
    position: z.number().int().min(0).max(100000).optional(),
  }),
});

const crmFollowUpSchema = z.object({
  body: z.object({
    nextFollowUpAt: z.string().datetime({ offset: true }).nullable(),
  }),
});

const crmNoteSchema = z.object({
  body: z.object({
    description: z.string().trim().min(1).max(5000),
  }),
});

const crmActivitySchema = z.object({
  body: z.object({
    type: z.enum(CRM_ACTIVITY_TYPES),
    description: z.string().trim().min(1).max(2000),
  }),
});

const prospeccaoSchema = z.object({
  body: z.object({
    nicho: z.string().trim().min(2, 'Nicho deve ter pelo menos 2 caracteres').max(80),
    cidade: z.string().trim().min(2, 'Cidade deve ter pelo menos 2 caracteres').max(80),
    estado: z
      .string()
      .trim()
      .max(8, 'Estado/região deve ter no máximo 8 caracteres')
      .optional()
      .default('')
      .transform((v) => (v ? v.toUpperCase() : v)),
    quantidade: z.number().int().min(1).max(500),
    filters: z
      .object({
        somenteComTelefone: z.boolean().optional(),
        somenteComSite: z.boolean().optional(),
        somenteSemSite: z.boolean().optional(),
        notaMinima: z.number().min(0).max(5).optional(),
        avaliacoesMinimas: z.number().int().min(0).optional(),
        somenteAbertos: z.boolean().optional(),
        evitarExistentes: z.boolean().optional(),
      })
      .optional(),
  }),
});

const leadFiltersSchema = z.object({
  query: z.object({
    search: z.string().trim().max(120).optional(),
    cidade: z.string().trim().max(80).optional(),
    estado: z.string().trim().max(2).optional(),
    status: z.union([z.string(), z.array(z.string())]).optional(),
    comTelefone: optionalQueryBoolean(),
    semTelefone: optionalQueryBoolean(),
    comSite: optionalQueryBoolean(),
    semSite: optionalQueryBoolean(),
    notaMinima: optionalQueryNumber(),
    orderBy: z
      .enum(['createdAt', 'nome', 'nota', 'avaliacoes', 'score', 'cidade', 'estado'])
      .optional(),
    order: z.enum(['asc', 'desc']).optional(),
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(200).optional(),
    ids: z.union([z.string(), z.array(z.string())]).optional(),
    crm: z.enum(['all', 'none', 'in']).optional(),
  }),
});

const leadIdParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1).max(64),
  }),
});

const leadPatchSchema = z.object({
  body: z.object({
    status: z
      .enum(['NOVO', 'CONTATADO', 'RESPONDEU', 'INTERESSADO', 'NEGOCIACAO', 'CLIENTE', 'IGNORADO'])
      .optional(),
    observacoes: z.string().max(2000).nullable().optional(),
    categoria: z.string().max(120).nullable().optional(),
    nicho: z.string().max(120).nullable().optional(),
    notasForm: z.any().optional(),
  }),
});

const enrichSchema = z.object({
  body: z.object({
    ids: z.array(z.string().min(1).max(64)).max(100),
  }),
});

const bulkStatusSchema = z.object({
  body: z.object({
    ids: z.array(z.string().min(1).max(64)).min(1).max(500),
    status: z.enum([
      'NOVO',
      'CONTATADO',
      'RESPONDEU',
      'INTERESSADO',
      'NEGOCIACAO',
      'CLIENTE',
      'IGNORADO',
    ]),
  }),
});

const bulkDeleteSchema = z.object({
  body: z.object({
    ids: z.array(z.string().min(1).max(64)).min(1).max(500),
  }),
});

const templateSchema = z.object({
  body: z.object({
    nome: z.string().trim().min(2).max(120),
    conteudo: z.string().trim().min(5),
    servico: z.string().trim().max(160).optional().nullable(),
  }),
});

const templatePatchSchema = z.object({
  body: templateSchema.shape.body.partial(),
});

const messageGenerateSchema = z.object({
  body: z.object({
    templateId: z.string().min(1),
    leadId: z.string().min(1),
  }),
});

const settingsSchema = z.object({
  body: z.object({
    semSite: z.number().int().min(0).max(100).optional(),
    temTelefone: z.number().int().min(0).max(100).optional(),
    avaliacoesMais20: z.number().int().min(0).max(100).optional(),
    notaQuatroCinco: z.number().int().min(0).max(100).optional(),
    avaliacoesMais50: z.number().int().min(0).max(100).optional(),
    enderecoCompleto: z.number().int().min(0).max(100).optional(),
    max: z.number().int().min(1).max(100).optional(),
  }),
});

export {
  prospeccaoSchema,
  leadFiltersSchema,
  leadIdParamsSchema,
  leadPatchSchema,
  enrichSchema,
  bulkStatusSchema,
  bulkDeleteSchema,
  templateSchema,
  templatePatchSchema,
  messageGenerateSchema,
  settingsSchema,
  crmFiltersQuerySchema,
  crmAddSchema,
  crmBulkAddSchema,
  crmLeadParamsSchema,
  crmPatchSchema,
  crmStagePatchSchema,
  crmFollowUpSchema,
  crmNoteSchema,
  crmActivitySchema,
};