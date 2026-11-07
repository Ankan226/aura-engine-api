import 'dotenv/config';
import mongoose from 'mongoose';
import { faker } from '@faker-js/faker';
import { Product } from '../src/models/Product.js';
import { CATEGORIES } from '../src/constants/inventory.js';

const TOTAL_PRODUCTS = Number(process.argv[2]) || 50_000;
const BATCH_SIZE = 1_000;


const PRODUCT_NOUNS = {
  Electronics: ['Wireless Headphones', 'Laptop', 'Bluetooth Speaker', 'Smartphone', '4K Monitor', 'Audio Receiver', 'Audio Interface', 'Tablet', 'Smart Watch', 'Gaming Keyboard', 'Webcam', 'Power Bank'],
  Apparel: ['Cotton T-Shirt', 'Denim Jacket', 'Running Shorts', 'Wool Sweater', 'Hooded Sweatshirt', 'Chino Pants', 'Winter Gloves', 'Baseball Cap'],
  'Home & Kitchen': ['Air Fryer', 'Coffee Maker', 'Blender', 'Cutlery Set', 'Memory Foam Pillow', 'Non-stick Pan', 'Vacuum Cleaner', 'Table Lamp'],
  'Sports & Outdoors': ['Yoga Mat', 'Camping Tent', 'Dumbbell Set', 'Hiking Backpack', 'Mountain Bike Helmet', 'Water Bottle', 'Resistance Bands', 'Sleeping Bag'],
  Beauty: ['Face Moisturizer', 'Vitamin C Serum', 'Hair Dryer', 'Lip Balm', 'Sunscreen SPF 50', 'Shampoo', 'Electric Shaver', 'Perfume'],
  Toys: ['Building Blocks Set', 'Remote Control Car', 'Puzzle 1000 Pieces', 'Plush Bear', 'Board Game', 'Action Figure', 'Art Supply Kit'],
  Grocery: ['Organic Coffee Beans', 'Olive Oil', 'Protein Bars', 'Basmati Rice', 'Green Tea Pack', 'Almond Butter', 'Pasta Variety Pack'],
  Automotive: ['Car Phone Mount', 'Engine Oil 5W-30', 'Wiper Blades', 'Tire Inflator', 'Dash Camera', 'Seat Cover Set', 'Jump Starter'],
};

const randomStockQuantity = () => {
  const roll = Math.random();
  if (roll < 0.03) return 0;                                  
  if (roll < 0.15) return faker.number.int({ min: 1, max: 19 }); 
  return faker.number.int({ min: 20, max: 500 });
};

const generateProduct = (index) => {
  const category = faker.helpers.arrayElement(CATEGORIES);
  const noun = faker.helpers.arrayElement(PRODUCT_NOUNS[category]);
  const cost = faker.number.float({ min: 2, max: 900, fractionDigits: 2 });
  const price = Number((cost * faker.number.float({ min: 1.15, max: 1.8, fractionDigits: 2 })).toFixed(2));

  return {
    productName: `${faker.commerce.productAdjective()} ${noun}`,
    sku: `${category.slice(0, 3).toUpperCase()}-${String(index + 1).padStart(6, '0')}`,
    category,
    price,
    cost,
    stockQuantity: randomStockQuantity(),
    reorderLevel: faker.number.int({ min: 10, max: 50 }),
    lastUpdated: faker.date.recent({ days: 90 }),
  };
};

const seed = async () => {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not defined');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected. Clearing existing products...');
  await Product.deleteMany({});

  const startedAt = Date.now();
  for (let inserted = 0; inserted < TOTAL_PRODUCTS; inserted += BATCH_SIZE) {
    const size = Math.min(BATCH_SIZE, TOTAL_PRODUCTS - inserted);
    const batch = Array.from({ length: size }, (_, i) => generateProduct(inserted + i));
    await Product.insertMany(batch, { ordered: false });
    console.log(`Inserted ${inserted + size}/${TOTAL_PRODUCTS}`);
  }

  console.log('Building indexes...');
  await Product.syncIndexes();

  const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`Done: ${TOTAL_PRODUCTS} products seeded in ${seconds}s`);
  await mongoose.disconnect();
};

seed().catch(async (error) => {
  console.error('Seeding failed:', error);
  await mongoose.disconnect();
  process.exit(1);
});