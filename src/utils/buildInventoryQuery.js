import { resolveCategory } from '../constants/inventory.js';

const buildSort = (sortParam) => {
  if (!sortParam) return { lastUpdated: -1, _id: 1 };
  const direction = sortParam.startsWith('-') ? -1 : 1;
  const field = sortParam.replace(/^-/, '');
  return { [field]: direction, _id: 1 };
};

const buildRange = (min, max) => {
  const range = {};
  if (min !== undefined) range.$gte = min;
  if (max !== undefined) range.$lte = max;
  return Object.keys(range).length ? range : undefined;
};

export const buildInventoryQuery = ({
  page, limit, search, category, sort, minPrice, maxPrice, minStock, maxStock,
}) => {
  const filter = {};

  if (search) filter.$text = { $search: search };

  if (category) {
    const canonical = resolveCategory(category);
    filter.category = canonical ?? { $in: [] };
  }

  const priceRange = buildRange(minPrice, maxPrice);
  if (priceRange) filter.price = priceRange;

  const stockRange = buildRange(minStock, maxStock);
  if (stockRange) filter.stockQuantity = stockRange;

  return {
    filter,
    sort: buildSort(sort),
    skip: (page - 1) * limit,
    limit,
    page,
  };
};