import { asyncHandler } from '../utils/asyncHandler.js';
import { getDashboardAnalytics } from '../services/analyticsService.js';

export const getAnalytics = asyncHandler(async (req, res) => {
  const data = await getDashboardAnalytics(req.query.category);
  res.json({ success: true, data });
});