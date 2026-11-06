import { z } from 'zod';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, SORTABLE_FIELDS } from '../constants/inventory.js';


const optionalNumber = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.coerce.number().min(0).optional()
);

const sortPattern = new RegExp(`^-?(${SORTABLE_FIELDS.join('|')})$`);

export const inventoryQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
    search: z.string().trim().max(100).optional(),
    category: z.string().trim().optional(),
    sort: z
      .string()
      .regex(sortPattern, `sort must be one of: ${SORTABLE_FIELDS.join(', ')} (prefix with - for descending)`)
      .optional(),
    minPrice: optionalNumber,
    maxPrice: optionalNumber,
    minStock: optionalNumber,
    maxStock: optionalNumber,
  })
  .refine((q) => q.minPrice === undefined || q.maxPrice === undefined || q.minPrice <= q.maxPrice, {
    message: 'minPrice cannot be greater than maxPrice',
    path: ['minPrice'],
  });

export const analyticsQuerySchema = z.object({
  category: z.string().trim().optional(),
});