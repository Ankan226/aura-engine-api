export const CATEGORIES = [
  'Electronics',
  'Apparel',
  'Home & Kitchen',
  'Sports & Outdoors',
  'Beauty',
  'Toys',
  'Grocery',
  'Automotive',
];


const normalize = (value) => String(value).toLowerCase().replace(/[^a-z0-9]/g, '');

const CATEGORY_LOOKUP = new Map(CATEGORIES.map((name) => [normalize(name), name]));

export const resolveCategory = (input) => CATEGORY_LOOKUP.get(normalize(input)) ?? null;

export const SORTABLE_FIELDS = [
  'price',
  'cost',
  'stockQuantity',
  'productName',
  'category',
  'sku',
  'lastUpdated',
];

export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 100;