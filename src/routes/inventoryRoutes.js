import { Router } from 'express';
import {
  getInventory,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/inventoryController.js';
import { validate, validateObjectId } from '../middleware/validate.js';
import { productPayloadSchema } from '../validators/productSchema.js';
import { inventoryQuerySchema } from '../validators/querySchemas.js';

const router = Router();

router
  .route('/')
  .get(validate(inventoryQuerySchema, 'query'), getInventory)
  .post(validate(productPayloadSchema), createProduct);

router
  .route('/:id')
  .get(validateObjectId, getProductById)
  .put(validateObjectId, validate(productPayloadSchema), updateProduct)
  .delete(validateObjectId, deleteProduct);

export default router;