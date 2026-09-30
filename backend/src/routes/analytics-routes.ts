import express from 'express';
import { createRouter } from '../utils/async-router.js';
import { collectPageView, updatePageView } from '../controllers/analytics-collect-controller.js';
import {
  getActivity,
  getBreakdown,
  getContent,
  getHeatmap,
  getOverview,
  getRealtime,
} from '../controllers/analytics-controller.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/require-admin.js';
import { analyticsLimiter } from '../middleware/rate-limit.js';
import { ensureVisitorId } from '../middleware/visitor.js';

const router = createRouter();

const collect = [
  analyticsLimiter,
  express.text({ type: 'text/plain', limit: '4kb' }),
  ensureVisitorId,
];
router.post('/collect', ...collect, optionalAuth, collectPageView);
router.post('/collect/:id', ...collect, updatePageView);

const admin = [requireAuth, requireRole('ADMIN')];
router.get('/overview', ...admin, getOverview);
router.get('/breakdown', ...admin, getBreakdown);
router.get('/content', ...admin, getContent);
router.get('/heatmap', ...admin, getHeatmap);
router.get('/realtime', ...admin, getRealtime);
router.get('/activity', ...admin, getActivity);

export default router;
