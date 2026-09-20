import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { asyncHandler } from '../utils/asyncHandler';
import { ok, okNoContent } from '../utils/respond';
import { badRequest, notFound } from '../utils/apiError';
import { websiteService } from '../services/WebsiteService';
import { generationQueue } from '../services/GenerationQueue';
import { env } from '../config/env';
import { googlePlacesService } from '../services/GooglePlacesService';
import { searchImages } from '../services/UnsplashService';

export const websitesRouter = Router();
const aiLimit = rateLimit({ windowMs: 60000, max: 10, message: { success: false, message: 'Aguarde um minuto antes de solicitar mais gerações.' } });
const photoSearchLimit = rateLimit({ windowMs: 60000, max: 45, standardHeaders: true, legacyHeaders: false });

const baseUrlOf = (value: unknown) => (typeof value === 'string' && /^https?:\/\/[^/]+/.test(value) ? value.replace(/\/+$/, '') : undefined);

websitesRouter.get('/', asyncHandler(async (_req, res) => { ok(res, await websiteService.list()); }));
websitesRouter.get('/photos', photoSearchLimit, asyncHandler(async (req, res) => {
  const { q } = z.object({ q: z.string().trim().min(2).max(120) }).parse(req.query);
  ok(res, { photos: await searchImages(q, 24) });
}));
websitesRouter.get('/place-photos/:placeId', photoSearchLimit, asyncHandler(async (req, res) => {
  if (!env.GOOGLE_MAPS_API_KEY) return ok(res, { photos: [] });
  const { placeId } = z.object({ placeId: z.string().regex(/^[A-Za-z0-9_-]{10,200}$/) }).parse(req.params);
  const place = await googlePlacesService.getPlaceDetails(placeId, ['id', 'photos', 'googleMapsUri']);
  ok(res, { photos: (place.photos ?? []).slice(0, 10).map((photo, index) => ({ url: `google-place://${encodeURIComponent(place.id)}/${index}`, alt: 'Foto deste estabelecimento no Google Maps', credit: photo.authorAttributions?.[0]?.displayName || 'Google Maps', creditUrl: photo.authorAttributions?.[0]?.uri || place.googleMapsUri || `https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(place.id)}`, provider: 'Google Maps' })) });
}));
websitesRouter.get('/place-photo', photoSearchLimit, asyncHandler(async (req, res) => {
  const { placeId, index } = z.object({ placeId: z.string().regex(/^[A-Za-z0-9_-]{10,200}$/), index: z.coerce.number().int().min(0).max(9) }).parse(req.query);
  if (!env.GOOGLE_MAPS_API_KEY) throw badRequest('Fotos do Google Maps indisponíveis.');
  const place = await googlePlacesService.getPlaceDetails(placeId, ['id', 'photos']);
  const photo = place.photos?.[index];
  if (!photo?.name || !photo.name.startsWith(`places/${placeId}/photos/`)) throw notFound('Foto indisponível.');
  const url = `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=1600`;
  const response = await fetch(url, { signal: AbortSignal.timeout(15000), headers: { 'X-Goog-Api-Key': env.GOOGLE_MAPS_API_KEY } });
  if (!response.ok) throw new Error('O Google Maps não conseguiu carregar esta foto.');
  const type = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(type)) throw new Error('Formato de imagem inválido.');
  const declaredLength = Number(response.headers.get('content-length') || 0);
  if (declaredLength > 12 * 1024 * 1024) throw new Error('A imagem ultrapassou o tamanho permitido.');
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > 12 * 1024 * 1024) throw new Error('A imagem ultrapassou o tamanho permitido.');
  res.setHeader('Content-Type', type); res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff'); res.send(buffer);
}));
websitesRouter.get('/public/:id', asyncHandler(async (req, res) => { ok(res, await websiteService.publicSite(String(req.params.id))); }));
websitesRouter.get('/lead/:id', asyncHandler(async (req, res) => { ok(res, await websiteService.byLead(String(req.params.id))); }));
websitesRouter.get('/queue', asyncHandler(async (_req, res) => { ok(res, generationQueue.snapshot()); }));
websitesRouter.post('/generate', aiLimit, asyncHandler(async (req, res) => {
  const { crmLeadId, baseUrl } = z.object({ crmLeadId: z.string().min(1).max(100), baseUrl: z.string().optional() }).parse(req.body);
  ok(res, await websiteService.generate(crmLeadId, baseUrlOf(baseUrl)));
}));
websitesRouter.get('/:id/versions', asyncHandler(async (req, res) => { ok(res, await websiteService.versions(String(req.params.id))); }));
websitesRouter.post('/:id/restore', aiLimit, asyncHandler(async (req, res) => {
  const { version } = z.object({ version: z.number().int().min(1) }).parse(req.body);
  ok(res, await websiteService.restore(String(req.params.id), version));
}));
websitesRouter.post('/:id/regenerate', aiLimit, asyncHandler(async (req, res) => {
  const { instruction, baseUrl } = z.object({ instruction: z.string().max(2000).optional(), baseUrl: z.string().optional() }).parse(req.body);
  ok(res, await websiteService.regenerate(String(req.params.id), instruction, baseUrlOf(baseUrl)));
}));
websitesRouter.post('/:id/rewrite', aiLimit, asyncHandler(async (req, res) => {
  const { instruction } = z.object({ instruction: z.string().min(1).max(2000) }).parse(req.body);
  ok(res, await websiteService.rewrite(String(req.params.id), instruction));
}));
websitesRouter.post('/:id/publish', asyncHandler(async (req, res) => { ok(res, await websiteService.publish(String(req.params.id))); }));
websitesRouter.post('/:id/unpublish', asyncHandler(async (req, res) => { ok(res, await websiteService.unpublish(String(req.params.id))); }));
websitesRouter.get('/:id', asyncHandler(async (req, res) => { ok(res, await websiteService.get(String(req.params.id))); }));
websitesRouter.delete('/:id', asyncHandler(async (req, res) => { await websiteService.remove(String(req.params.id)); okNoContent(res); }));