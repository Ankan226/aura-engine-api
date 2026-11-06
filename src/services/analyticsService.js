import { Product } from '../models/Product.js';
import { resolveCategory } from '../constants/inventory.js';

const INVENTORY_VALUE = { $multiply: ['$price', '$stockQuantity'] };

export const getDashboardAnalytics = async (categoryParam) => {
  const matchStage = {};
  if (categoryParam) matchStage.category = resolveCategory(categoryParam) ?? { $in: [] };

  const pipeline = [
    { $match: matchStage },

    {
      $facet: {
        summary: [
          {
            $group: {
              _id: null,
              totalSKUs: { $sum: 1 },
              totalInventoryValue: { $sum: INVENTORY_VALUE },
              outOfStockItems: { $sum: { $cond: [{ $eq: ['$stockQuantity', 0] }, 1, 0] } },
            },
          },
          {
            $project: {
              _id: 0,
              totalSKUs: 1,
              outOfStockItems: 1,
              totalInventoryValue: { $round: ['$totalInventoryValue', 2] },
            },
          },
        ],

        restockPriority: [
          { $sort: { stockQuantity: 1, productName: 1 } },
          { $limit: 10 },
          {
            $project: {
              _id: 0,
              productId: '$_id',
              productName: 1,
              sku: 1,
              category: 1,
              stockQuantity: 1,
              reorderLevel: 1,
            },
          },
        ],

        categoryDistribution: [
          {
            $group: {
              _id: '$category',
              totalValue: { $sum: INVENTORY_VALUE },
              productCount: { $sum: 1 },
            },
          },
          { $sort: { totalValue: -1 } },
          { $project: { _id: 0, category: '$_id', totalValue: 1, productCount: 1 } },
        ],
      },
    },

    {
      $project: {
        summary: { $arrayElemAt: ['$summary', 0] },
        restockPriority: 1,
        categoryDistribution: 1,
      },
    },

    {
      $project: {
        summary: 1,
        restockPriority: 1,
        categoryDistribution: {
          $map: {
            input: '$categoryDistribution',
            as: 'c',
            in: {
              category: '$$c.category',
              productCount: '$$c.productCount',
              totalValue: { $round: ['$$c.totalValue', 2] },
              percentage: {
                $cond: [
                  { $gt: ['$summary.totalInventoryValue', 0] },
                  {
                    $round: [
                      { $multiply: [{ $divide: ['$$c.totalValue', '$summary.totalInventoryValue'] }, 100] },
                      1,
                    ],
                  },
                  0,
                ],
              },
            },
          },
        },
      },
    },
  ];

  const [result] = await Product.aggregate(pipeline);

  return {
    summary: result?.summary ?? { totalSKUs: 0, totalInventoryValue: 0, outOfStockItems: 0 },
    restockPriority: result?.restockPriority ?? [],
    categoryDistribution: result?.categoryDistribution ?? [],
  };
};