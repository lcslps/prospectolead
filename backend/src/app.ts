import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { dashboardRouter } from './routes/dashboard';
import { prospeccaoRouter } from './routes/prospeccao';
import { leadsRouter } from './routes/leads';
import { campaignsRouter } from './routes/campaigns';
import { templatesRouter } from './routes/templates';
import { messagesRouter } from './routes/messages';
import { settingsRouter } from './routes/settings';
import { crmRouter } from './routes/crm';
import { websitesRouter } from './routes/websites';

export function createApp(): Express {
  const app = express();

  app.set('trust proxy', 1);

  app.use(helmet());

  const corsOrigins = [env.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'];
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || corsOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error('Origem não permitida pelo CORS'));
      },
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  app.use(express.json({ limit: '12mb' }));

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Muitas requisições. Tente novamente mais tarde.' },
    keyGenerator: (req) =>
      (req.headers['x-nf-client-connection-ip'] as string) ||
      req.ip ||
      req.socket.remoteAddress ||
      'unknown',
  });
  app.use('/api', limiter);

  app.get('/api/health', (_req, res) => {
    res.json({ success: true, data: { status: 'ok', hasGoogleKeyConfigured: env.GOOGLE_MAPS_API_KEY.length > 0 } });
  });

  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/prospeccao', prospeccaoRouter);
  app.use('/api/leads', leadsRouter);
  app.use('/api/campaigns', campaignsRouter);
  app.use('/api/templates', templatesRouter);
  app.use('/api/messages', messagesRouter);
  app.use('/api/settings', settingsRouter);
  app.use('/api/crm', crmRouter);
  app.use('/api/websites', websitesRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
