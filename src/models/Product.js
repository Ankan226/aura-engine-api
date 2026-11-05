import mongoose from 'mongoose';
import { CATEGORIES } from '../constants/inventory.js';

const productSchema = new mongoose.Schema(
  {
    productName: { type: String, required: true, trim: true, minlength: 2, maxlength: 150 },
    sku: { type: String, required: true, unique: true, trim: true, uppercase: true }, 
    category: { type: String, required: true, enum: CATEGORIES },
    price: { type: Number, required: true, min: 0 },
    cost: { type: Number, required: true, min: 0 },
    stockQuantity: {
      type: Number,
      required: true,
      min: [0, 'stockQuantity cannot be negative'],
      validate: { validator: Number.isInteger, message: 'stockQuantity must be a whole number' },
    },
    reorderLevel: { type: Number, required: true, min: 0, default: 10 },
    lastUpdated: { type: Date, default: Date.now },
  },
  { versionKey: false }
);


productSchema.index({ category: 1 });
productSchema.index({ productName: 1 });
productSchema.index({ productName: 'text' });
productSchema.index({ price: -1 });
productSchema.index({ stockQuantity: 1 });

export const Product = mongoose.model('Product', productSchema);