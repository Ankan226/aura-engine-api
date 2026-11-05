import { z } from 'zod';
import { CATEGORIES } from '../constants/inventory.js';

const money = (field) =>
  z
    .number({ required_error: `${field} is required`, invalid_type_error: `${field} must be a number` })
    .min(0, `${field} cannot be negative`);

const wholeNumber = (field) =>
  z
    .number({ required_error: `${field} is required`, invalid_type_error: `${field} must be a number` })
    .int(`${field} must be a whole number`)
    .min(0, `${field} cannot be negative`);

export const productPayloadSchema = z
  .object({
    productName: z
      .string({ required_error: 'productName is required' })
      .trim()
      .min(2, 'productName must be at least 2 characters')
      .max(150, 'productName must be at most 150 characters'),
    sku: z
      .string({ required_error: 'sku is required' })
      .trim()
      .min(3, 'sku must be at least 3 characters')
      .max(40, 'sku must be at most 40 characters')
      .transform((value) => value.toUpperCase()),
    category: z.enum(CATEGORIES, {
      errorMap: () => ({ message: `category must be one of: ${CATEGORIES.join(', ')}` }),
    }),
    price: money('price'),
    cost: money('cost'),
    stockQuantity: wholeNumber('stockQuantity'),
    reorderLevel: wholeNumber('reorderLevel').default(10),
  })
  .refine((product) => product.price >= product.cost, {
    message: 'price cannot be lower than cost',
    path: ['price'],
  });