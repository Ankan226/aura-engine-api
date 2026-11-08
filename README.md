# Aura Engine API

High-performance inventory backend for the **Aura Enterprise Engine** project. It is built to search, filter, paginate and analyse **50,000+ SKUs** without freezing the client, replacing a workflow where loading the "All Inventory" page took around 45 seconds.

**Live API:** `https://aura-engine-api-dn9y.onrender.com/`

---

## Features

- **Server-side pagination**: the API only ever returns one page (default 50 items) plus metadata (`totalRecords`, `totalPages`, `currentPage`, `hasNextPage`).
- **Index-backed search**: MongoDB text index on `productName` for fast omnisearch.
- **Dynamic filtering and sorting**: category, price range, stock range, multi-field sort.
- **Aggregation analytics**: totals, restock priority and category valuation computed inside MongoDB with a single `$facet` pipeline, not in JavaScript.
- **Strict validation**: Zod middleware on `POST` and `PUT`, enforcing business rules (`price >= cost`, `stockQuantity >= 0`).
- **50,000-record seeder**: standalone script using `@faker-js/faker`.
- **Production hygiene**: Helmet, CORS, gzip compression, centralised error handling, request logging.

## Tech Stack

Node.js 18+ · Express 4 · MongoDB Atlas · Mongoose 8 · Zod · Faker


## Getting Started

### 1. Install

```bash
git clone https://github.com/Ankan226/aura-engine-api
cd aura-engine-api
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `PORT` | Server port (default `5000`) |
| `NODE_ENV` | `development` or `production` |
| `MONGODB_URI` | MongoDB Atlas connection string, including the database name `/aura_engine` |
| `CORS_ORIGIN` | Allowed origin(s), comma separated, or `*` |

### 3. Seed 50,000 products

```bash
npm run seed
```

You can pass a custom amount: `node scripts/seed.js 10000`.

### 4. Run

```bash
npm run dev      
npm start        
```

## API Reference

Base URL: `http://localhost:5000`

### `GET /api/inventory`

| Query param | Example | Description |
|---|---|---|
| `page` | `1` | Page number (default 1) |
| `limit` | `50` | Items per page (default 50, max 100) |
| `search` | `laptop` | Whole-word text search on `productName` |
| `category` | `electronics` | Case-insensitive category filter |
| `sort` | `-price` | Field name; prefix `-` for descending |
| `minPrice` / `maxPrice` | `20` / `100` | Price range |
| `minStock` / `maxStock` | `0` / `20` | Stock range |

Sortable fields: `price`, `cost`, `stockQuantity`, `productName`, `category`, `sku`, `lastUpdated`.

**Example:** `GET /api/inventory?page=1&limit=50&search=audio&category=electronics&sort=-price`

```json
{
  "success": true,
  "data": [ { "_id": "...", "productName": "...", "sku": "ELE-000123", "category": "Electronics", "price": 249.99, "cost": 150, "stockQuantity": 42, "reorderLevel": 20, "lastUpdated": "..." } ],
  "pagination": {
    "totalRecords": 312,
    "totalPages": 7,
    "currentPage": 1,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### `GET /api/analytics`

Optional: `?category=electronics`. Returns data shaped for dashboard widgets:

```json
{
  "success": true,
  "data": {
    "summary": { "totalSKUs": 50000, "totalInventoryValue": 0, "outOfStockItems": 0 },
    "restockPriority": [ { "productName": "...", "sku": "...", "stockQuantity": 0 } ],
    "categoryDistribution": [ { "category": "Electronics", "totalValue": 0, "productCount": 0, "percentage": 0 } ]
  }
}
```

(Values above are placeholders; the real response contains the live computed numbers.)

### Other endpoints

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/inventory/:id` | Get one product |
| `POST` | `/api/inventory` | Create a product (validated) |
| `PUT` | `/api/inventory/:id` | Update a product (validated) |
| `DELETE` | `/api/inventory/:id` | Delete a product |
| `GET` | `/api/health` | Service health |

### Validation rules

| Rule | Result |
|---|---|
| `price` lower than `cost` | `400` + `price cannot be lower than cost` |
| `stockQuantity` negative | `400` + `stockQuantity cannot be negative` |
| Invalid category / missing field | `400` + field-level message |
| Duplicate `sku` | `409` + `A product with this sku already exists` |
| Malformed id | `400` + `Invalid product id` |

Error format:

```json
<img width="637" height="225" alt="image" src="https://github.com/user-attachments/assets/e803ceaa-352c-4be3-bfc6-79d2ba80e29b" />

```

## Performance

Indexes: `sku` (unique), `category`, `productName`, `productName` (text), `price`, `stockQuantity`.

Verified with MongoDB `explain` on 50,000+ documents:

| Query | Plan | Docs examined / returned | Time |
|---|---|---|---|
| `{ sku: "..." }` | `EXPRESS_IXSCAN` (`sku_1`) | 1 / 1 | 0 ms |
| `{ category: "Toys" }` | `IXSCAN` (`category_1`) | 6,213 / 6,213 | 10 ms |
| `{ $text: { $search: "laptop" } }` | `TEXT_MATCH` (`productName_text`) | 547 / 547 | 1 ms |

`GET /api/analytics` response time: **`<fill in> ms`** (target under 500 ms).

## Design Decisions

- **Text index instead of regex.** A case-insensitive regex cannot use an index and would scan every document. The text index is much faster but matches whole words only (`laptop`, not `lapt`). Chosen deliberately for speed at scale.
- **`$facet` aggregation.** One database round trip produces the KPI summary, the restock list and the category breakdown together.
- **Stable pagination.** Sorting adds `_id` as a tie-breaker so rows never repeat or disappear between pages.
- **`lean()` queries and parallel count.** The data query and `countDocuments` run with `Promise.all`, and Mongoose document overhead is skipped.
- **Thin layers.** Routes wire URLs, controllers handle HTTP, services hold business logic, validators are reusable middleware.

## Deployment (Render)

1. Push this repo to GitHub.
2. Render → **New Web Service** → connect the repo.
3. Build command: `npm install` · Start command: `npm start`.
4. Set environment variables: `MONGODB_URI`, `NODE_ENV=production`, `CORS_ORIGIN`.
5. In MongoDB Atlas, allow Render in **Network Access** (`0.0.0.0/0` for this MVP).

Free-tier services sleep when idle, so the first request can take a few seconds.

## AI Transparency

See [`Prompts.md`](./Prompts.md) for how AI assistance was used and what was verified manually.

## License

Developed as a commercial deliverable for the Aura Enterprise Engine project. All rights reserved.
