import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { validate } from '../middleware/validate';
import { messageGenerateSchema } from '../schemas';
import { messageService } from '../services/MessageService';
import { ok, validatedBody } from '../utils/respond';

export const messagesRouter = Router();

messagesRouter.post(
  '/generate',
  validate(messageGenerateSchema),
  asyncHandler(async (req, res) => {
    const { templateId, leadId } = validatedBody<{ templateId: string; leadId: string }>(req);
    const message = await messageService.generate(templateId, leadId);
    ok(res, { message });
  }),
);