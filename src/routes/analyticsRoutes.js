import { Router } from 'express';
import { getAnalytics } from '../controllers/analyticsController.js';
import { validate } from '../middleware/validate.js';
import { analyticsQuerySchema } from '../validators/querySchemas.js';

const router = Router();

router.get('/', validate(analyticsQuerySchema, 'query'), getAnalytics);

export default router;