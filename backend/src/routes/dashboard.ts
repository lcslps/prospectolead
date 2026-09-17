import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { dashboardService } from '../services/DashboardService';
import { ok } from '../utils/respond';

export const dashboardRouter = Router();

dashboardRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const data = await dashboardService.getData();
    ok(res, data);
  }),
);