## 1. Architecture and folder structure

**Problem:** The brief requires modular code (`/controllers`, `/routes`, `/models`) and is graded on DRY and naming.

**Prompt:**
> "Make this project end to end for the full-stack track. First give a proper folder structure, then file-wise code one by one."

**What the AI suggested:** A layered structure (routes → controllers → services, with validators, middleware, utils and constants separated), ES modules, and a standalone `scripts/seed.js`.

**What I verified / changed:**
- Read every file to understand its responsibility before committing it.
- Confirmed the layers stay thin: routes only wire URLs, controllers only handle HTTP, the pipeline lives in `services/analyticsService.js`.
- Kept all categories, sortable fields and page limits in one place (`constants/inventory.js`) so the model, validators, seeder and query builder cannot drift apart.

---

## 2. MongoDB aggregation pipeline (`GET /api/analytics`)

**Problem:** I needed total SKUs, total inventory value (`price * stockQuantity`), out-of-stock count, the 10 lowest-stock products, and valuation per category, without loading 50,000 records into JavaScript.

**Prompt:**
> "How do I compute total inventory value grouped by category, plus the top 10 lowest stock products, in one MongoDB aggregation using $group, $match and $project?"

**What the AI suggested:** A `$facet` stage running three sub-pipelines in parallel (summary, restock priority, category distribution), followed by `$project` stages.

**What I verified / changed:**
- Learned why `$facet` is used: one database round trip, one pass over the matched data.
- A single `$project` cannot reference a field it is creating, so the percentage-per-category calculation is a second `$project` after the summary is unwrapped.
- Divide-by-zero is guarded with `$cond` for an empty collection or empty category filter.
- Tested in Postman and checked the response time against the 500 ms target. Cross-checked the totals against the data in Atlas.

---

## 3. Search strategy: regex vs text index

**Problem:** The omnisearch (`?search=laptop`) must be fast on 50,000 records.

**Prompt:**
> "Should I use regex or a text index for searching product names in MongoDB with 50k documents?"

**What the AI suggested:** A text index. A case-insensitive regex cannot use a standard index and forces a collection scan.

**Trade-off I accepted:** Text search matches whole words, so `laptop` matches but `lapt` does not.

**What I verified:** Ran `explain` in Atlas on `{ $text: { $search: "laptop" } }`. Result: `TEXT_MATCH → FETCH → IXSCAN` on `productName_text`, 547 documents examined and 547 returned, 1 ms.

---

## 4. Index verification

**Problem:** I needed proof the required indexes on `sku`, `category` and `productName` work.

**What happened:** My first `explain` showed a `COLLSCAN` over 50,001 documents. I asked the AI why. It explained my query bar was empty (`parsedQuery: {}`), so there was no filter for an index to use, and a full scan is correct in that case.

**What I verified:** Re-ran with real filters:

| Query | Plan | Examined / returned | Time |
|---|---|---|---|
| `{ sku: "..." }` | `EXPRESS_IXSCAN` on `sku_1` | 1 / 1 | 0 ms |
| `{ category: "Toys" }` | `IXSCAN` on `category_1` | 6,213 / 6,213 | 10 ms |
| `{ $text: { $search: "laptop" } }` | `TEXT_MATCH` on `productName_text` | 547 / 547 | 1 ms |

---

## 5. Validation with Zod

**Problem:** Reject bad data with a `400` and a specific message: `price` must not be lower than `cost`, and `stockQuantity` must not be negative.

**Prompt:**
> "Zod schema where price must be greater than or equal to cost, with the error attached to the price field."

**What the AI suggested:** `z.object({...}).refine(...)` with `path: ['price']`.

**What I verified / changed:**
- Learned that `.refine()` on an object runs only after every individual field passes, so the two rules produce separate errors. I tested each rule separately in Postman.
- Added `.int()` for `stockQuantity` and `reorderLevel`.
- Kept a generic `validate(schema, source)` middleware so POST, PUT and the GET query all share the same code (DRY).
- Confirmed duplicate SKUs return `409` and malformed ids return `400`.

---

## 6. Seeder script

**Problem:** Generate 50,000 realistic products quickly.

**Prompt:**
> "Write a standalone Node script using faker to insert 50,000 realistic products in batches."

**What the AI suggested:** Batches of 1,000 with `insertMany({ ordered: false })`, product names built from category-specific nouns so searches like "laptop" return sensible results, and a price always above cost.

**What I verified:** Seeded 50,000 documents in about 9 seconds, then confirmed the count and the indexes in Atlas.

---

## 7. Debugging: Atlas `bad auth`

**Problem:** `MongoServerError: bad auth : authentication failed` when seeding.

**What the AI suggested:** The network and string format were fine, so the database user or password was wrong. Reset the password, use letters and numbers only, and make sure the `< >` placeholder brackets are removed.

**What I did:** Reset the database user password in Atlas, updated `.env`, and the seed succeeded. `.env` is in `.gitignore` and was never committed.