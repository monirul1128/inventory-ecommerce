# Storefront Implementation Plan — Furniture E-Commerce (Customer Site)

## Goal
Build ONLY the public customer-facing storefront under the `(public)` route group. Admin panel, API routes, Prisma schema, shared libs, middleware, and seed data already exist and must NOT be modified except `next.config.ts` (one line, required for the build) and the new storefront files/components.

## Repo reality found during exploration (READ BEFORE IMPLEMENTING)
- Next.js **16.4.3** (App Router, Turbopack), React 19, Tailwind **v4**, zustand 5, react-hot-toast. Path alias `@/* -> ./src/*`.
- **No test framework is installed** (no vitest/jest). Verification = `npx prisma generate`, `npx tsc --noEmit`, `npm run build`, `npm run lint`. `npm run build` = `prisma generate && next build`.
- `src/app/layout.tsx` (root) has NO SessionProvider/Toaster; each section layout adds its own. `src/app/admin/(protected)/layout.tsx` and the existing `src/app/(public)/layout.tsx` each wrap with `SessionProvider` + `Toaster`. Keep that pattern.
- Middleware (`src/middleware.ts`) makes everything not under `/admin` public (no auth). Storefront routes need no auth. Do NOT touch middleware.
- **The storefront already exists from a prior attempt but uses the WRONG architecture** (localStorage + a custom `cart-updated` event, inline `ProductCard` per page, components named `public-navbar.tsx`/`public-footer.tsx`, all pages are client components). This plan REBUILDS it to the spec'd architecture: zustand store, `site-navbar.tsx`/`site-footer.tsx`, shared `product-card.tsx`/`product-grid.tsx`, `cart-provider.tsx`, and server components for homepage / product / order-detail.

### CRITICAL BUILD FINDING — `cacheComponents: true` breaks the build today
`next.config.ts` sets `cacheComponents: true` and `partialPrefetching: true`. Running `npm run build` now FAILS (exit 1):
```
Error: Route "/orders/[orderId]": Next.js encountered uncached or runtime data during prerendering.
```
Under Cache Components, any page that awaits `params`/`searchParams` or does uncached data access without a `<Suspense>` boundary fails prerendering. The existing client pages use `use(params)` (no Suspense) and the admin dashboard does an uncached `fetch(..., {cache:'no-store'})` (no Suspense) — so the WHOLE app is incompatible with this flag, not just the storefront. We are forbidden from modifying admin pages.

**Decision (the linchpin): set `cacheComponents: false` and `partialPrefetching: false` in `next.config.ts`.** Rationale: with Cache Components off, Next 16 reverts to standard semantics where (a) dynamic routes `[id]` without `generateStaticParams` render on-demand (no prerender error), (b) `fetch(..., {cache:'no-store'})` / `force-dynamic` opts routes into dynamic rendering (no build-time DB/network), and (c) the admin dashboard builds without edits. This is the one shared-config change and it is "strictly needed for the storefront" because the storefront cannot ship a green build otherwise without rewriting admin. The remaining build requirement (`useSearchParams` in client `/shop` must sit inside a `<Suspense>` boundary) is handled in the Shop feature.

## Data-source decision per page (server components call prisma directly)
Server components call **prisma directly** (`@/lib/prisma`), NOT the public API — server-side `fetch` to the app's own routes needs an absolute URL + env, whereas prisma-direct needs neither. All storefront server pages set `export const dynamic = 'force-dynamic'` so the build never executes prisma at build time (no DB needed to build). Client pages (`/shop`, `/cart`, `/checkout`, `/orders`) fetch the existing public API as today.

Notes on Prisma types (from `prisma/schema.prisma`):
- `Product.images` is `Json @default("[]")` → cast to `string[]` before rendering/passing to client components.
- `Product.stock` is `Float`; `OrderItem.qty` is `Int` → cart qty is integer; quantity selector clamps to `1..Math.floor(stock)` (stock is whole for PIECE furniture).
- `Order` has NO `delivery` field → delivery charge is folded into `total`; the order detail page shows subtotal / discount(if any) / total (delivery is the implicit difference). This is an explicit assumption because the schema cannot store a separate delivery value.
- `PaymentMethod` enum includes `COD`, `BKASH`, `NAGAD` (the three the storefront offers). `OrderStatus`: PENDING/PROCESSING/SHIPPED/DELIVERED/CANCELLED.

## Existing API endpoints each page uses (verified by reading the routes)
- `GET /api/products/public?page=&limit=&categorySlug=&search=&sort=&featured=true` → `{ products, total, page, totalPages }`. `sort` accepts `newest` (default) | `price-asc` | `price-desc` (NOT `best`). Filters `stock: { gt: 0 }`.
- `GET /api/categories/public` → top-level categories with `children` (2 levels).
- `POST /api/orders` body: `{ customerName, phone, address, items: [{productId, qty, price}], subtotal, discount, total, paymentMethod, note }` → returns created order incl. `id`, `orderNo`. (No delivery field — fold into `total`.)
- `GET /api/orders?phone=XXXX` → array of orders (phone filter ALREADY supported via `where.phone = { contains: phone }`). No API change needed.
- `GET /api/orders/[id]` → order with `items` (each `product` with `category`). Not-found → `{ error }` 404.
- Best sellers: there is NO `sort=best` on the public API. Homepage computes best sellers via a prisma `saleItem.groupBy` aggregation (server-side). With the seed having zero Sales, this section is empty and hidden (matches existing behavior).

## Zustand cart store — exact shape and persistence
File `src/lib/cart-store.ts`:
- `create` + `persist` + `createJSONStorage(() => localStorage)`, storage key `"furniture-cart"`, **`skipHydration: true`** (so SSR renders an empty cart = no hydration mismatch; `CartProvider` rehydrates after mount).
- `CartItem = { id: string; name: string; price: number; image: string | null; qty: number; unit: string }`
- `CartState = { items: CartItem[]; addItem(item: Omit<CartItem,'qty'> & { qty?: number }): void; removeItem(id): void; updateQty(id, qty): void; clearCart(): void }`
- `addItem` increments qty if id exists, else pushes with `qty ?? 1`. `updateQty` clamps `Math.max(1, qty)`.
- Exported selectors: `selectTotalItems = (s) => s.items.reduce((n,i)=>n+i.qty,0)` and `selectTotalPrice = (s) => s.items.reduce((n,i)=>n+i.qty*i.price,0)`.
- Exported helper `getDelivery(subtotal: number): number` → `subtotal <= 0 ? 0 : subtotal >= 5000 ? 0 : 60` (৳60, free over ৳5000). Used by `/cart` and `/checkout`.

`src/components/cart-provider.tsx` (`'use client'`): on mount calls `useCartStore.persist.rehydrate()`, renders `children`. Mounted in `(public)/layout.tsx`.

Navbar/cart badge: render count only when `mounted && totalItems > 0` to avoid any SSR/CSR flash.

## (public) route group layout
`src/app/(public)/layout.tsx` (server component): wraps children in `SessionProvider` → `CartProvider` → `SiteNavbar` + `<main className="min-h-screen">{children}</main>` + `SiteFooter` + `<Toaster position="top-right" />`. Root `src/app/layout.tsx` stays untouched.

## Mobile menu
Use the shadcn `Sheet` (`@/components/ui/sheet`, built on Base UI Dialog which supports controlled `open`/`onOpenChange` — verified). `<Sheet open={open} onOpenChange={setOpen}>`, a hamburger `<button onClick={()=>setOpen(true)}>`, `<SheetContent side="left">` with nav links that call `setOpen(false)` on click.

## Styling conventions to match (from existing storefront + admin)
- Raw Tailwind v4 utility classes; warm palette: `bg-amber-50/100`, accents `amber-600/700/800/900` + `orange-50/600`, text `gray-700/800`/`neutral-800`. Cards: `bg-white rounded-xl shadow-sm border border-amber-100`. Skeletons: `animate-pulse`. Truncate: `line-clamp-2`.
- Images: `next/image` for product images; when `images` is empty/missing render an emoji fallback (`🪑`) inside an `bg-amber-50` box (seed has `images: []` for every product, so the fallback is the common path).
- Prices: use `formatCurrency` from `@/lib/utils` (returns `৳…`). Bengali labels throughout.
- Toast: `react-hot-toast` (`toast.success/error`).
- Client/server split: interactive parts (add-to-cart, qty, buy-now, filters, status timeline) are `'use client'` children; data pages are async server components that `await params`.

---

# Implementation order (shared foundation first)

## 1. Foundation: config + cart store + shared components + layout
What: disable Cache Components; create the zustand cart store, cart provider, site navbar, site footer, shared product card, shared product grid; rewire the public layout; remove the old public-navbar/public-footer.
Files:
- Modify `c:\Users\360\Downloads\inventory\next.config.ts` — set `cacheComponents: false`, `partialPrefetching: false` (keep `images` config as-is).
- Create `c:\Users\360\Downloads\inventory\src\lib\cart-store.ts` (zustand + persist, shape above, `getDelivery`, selectors).
- Create `c:\Users\360\Downloads\inventory\src\components\cart-provider.tsx` (`'use client'`, rehydrate on mount).
- Create `c:\Users\360\Downloads\inventory\src\components\site-navbar.tsx` (`'use client'`): logo `ফার্নিচার স্টোর`, links হোম / শপ / অর্ডার ট্র্যাক, search box → `/shop?search=`, cart icon with `selectTotalItems` badge (mounted-guarded), Sheet mobile menu.
- Create `c:\Users\360\Downloads\inventory\src\components\site-footer.tsx` (server): shop info, contact, quick links, copyright, warm amber-900 footer.
- Create `c:\Users\360\Downloads\inventory\src\components\product-card.tsx` (`'use client'`): props `{ product: { id; name; sellPrice; images: string[]; stock: number; category?: {name;slug} } }`; next/image with emoji fallback; price via `formatCurrency`; `কার্টে যোগ করুন` button calls `addItem` + `toast.success`, disabled when `stock <= 0` (label `স্টক নেই`).
- Create `c:\Users\360\Downloads\inventory\src\components\product-grid.tsx` (`'use client'`): props `{ categorySlug?: string; fixedCategory?: boolean; initialSearch?: string; initialCategorySlug?: string; initialFeatured?: boolean }`. Manages `page, sort(newest|price-asc|price-desc), selectedCategories, minPrice, maxPrice, search`. Fetches `/api/products/public` (page/limit 12/categorySlug/sort/search/featured) and `/api/categories/public`. Desktop sidebar filters + mobile filter Sheet, sort dropdown, pagination (prev/next + numbered), `animate-pulse` skeletons, empty state. Reuses `ProductCard`.
- Modify `c:\Users\360\Downloads\inventory\src\app\(public)\layout.tsx` — use `SiteNavbar`/`SiteFooter`/`CartProvider` as described.
- Delete `c:\Users\360\Downloads\inventory\src\components\public-navbar.tsx` and `c:\Users\360\Downloads\inventory\src\components\public-footer.tsx` (replaced by site-*).
Verify: `npx tsc --noEmit` exits 0. (Full `npm run build` is only green after all features; verified at convergence.)

## 2. Homepage (server component)
What: async server component, `export const dynamic = 'force-dynamic'`, fetch via prisma directly: featured products (`isFeatured:true, stock>0`, take 8), new arrivals (`stock>0` order `createdAt desc` take 8), categories (top-level w/ children), best sellers (`saleItem.groupBy` by `productId` `_sum.qty desc` take 6 → fetch those products, keep stock>0). Cast `images` to `string[]`. Render hero (gradient amber/orange, heading `আপনার ঘরের জন্য সেরা ফার্নিচার`, CTA `কেনাকাটা শুরু করুন` → `/shop`), categories grid (emoji + name) linking to `/shop/[slug]`, featured grid (`ProductCard`), new arrivals, best sellers (hidden when empty), CTA banner. Use `formatCurrency`.
Files:
- Rewrite `c:\Users\360\Downloads\inventory\src\app\(public)\page.tsx` (server component; remove `'use client'` and the localStorage `addToCart`).
Verify: `npx tsc --noEmit` exits 0.

## 3. Shop + category + product detail (browse)
What: `/shop` (client) wraps `useSearchParams` in `<Suspense>` and passes initial filters to `ProductGrid`; `/shop/[categorySlug]` (server) awaits params, fetches category name via prisma, renders breadcrumb/title + `<ProductGrid categorySlug fixedCategory />`; `/product/[id]` (server) awaits params, fetches product via prisma (`include: { category: { include: { parent } } }`), renders breadcrumb, next/image gallery (main + thumbnails), info (name, price `formatCurrency`, stock badge, unit, description, category, SKU, barcode), and a `'use client'` `ProductActions` child (qty selector `1..floor(stock)`, `কার্টে যোগ করুন` → `addItem`+toast, `এখনই কিনুন` → `addItem`+`router.push('/checkout')`), related products (same category, stock>0, id≠current, take 4) as `ProductCard`. Not found → `পণ্যটি পাওয়া যায়নি` block + link to `/shop` (product shown with `স্টক নেই` badge + disabled cart when stock=0).
Files:
- Rewrite `c:\Users\360\Downloads\inventory\src\app\(public)\shop\page.tsx` (`'use client'`, Suspense around `useSearchParams`).
- Rewrite `c:\Users\360\Downloads\inventory\src\app\(public)\shop\[categorySlug]\page.tsx` (server, `force-dynamic`).
- Rewrite `c:\Users\360\Downloads\inventory\src\app\(public)\product\[id]\page.tsx` (server, `force-dynamic`) + create `c:\Users\360\Downloads\inventory\src\components\product-actions.tsx` (`'use client'`).
Verify: `npx tsc --noEmit` exits 0.

## 4. Cart + checkout (client, zustand)
What: `/cart` reads `useCartStore`, table (image, name, price, qty ±, line total, remove), summary (subtotal, delivery via `getDelivery`, total), `চেকআউট এ যান` → `/checkout`, empty state `শপিং শুরু করুন` → `/shop`, `কেনা চালিয়ে যান` → `/shop`. `/checkout` reads cart from store; order form (name, phone, address textarea, note, payment radio COD/BKASH/NAGAD); summary (items, subtotal, delivery, total); validate name/phone(11 digits)/address; `অর্ডার নিশ্চিত করুন` → `POST /api/orders` with `total = subtotal + delivery`; on success `clearCart`, show order confirmation with `orderNo` + link to `/orders/[id]`; empty cart → redirect to `/shop` with toast.
Files:
- Rewrite `c:\Users\360\Downloads\inventory\src\app\(public)\cart\page.tsx` (`'use client'`).
- Rewrite `c:\Users\360\Downloads\inventory\src\app\(public)\checkout\page.tsx` (`'use client'`).
Verify: `npx tsc --noEmit` exits 0.

## 5. Order tracking
What: `/orders` (client) phone search → `GET /api/orders?phone=`, list (orderNo, date, total, color-coded status badge PENDING=yellow/PROCESSING=blue/SHIPPED=indigo/DELIVERED=green/CANCELLED=red, ট্র্যাক করুন → `/orders/[id]`). `/orders/[orderId]` (server, `force-dynamic`) awaits params, fetches order via prisma (`include items.product`), renders header/orderNo/date, customer info, items table (image/name/qty/price/total), payment method, totals (subtotal/total; discount if any), and a `'use client'` `OrderTimeline` child (stepper PENDING→PROCESSING→SHIPPED→DELIVERED highlighting current; CANCELLED → red banner). Not found → `অর্ডার পাওয়া যায়নি` + link to `/orders`.
Files:
- Rewrite `c:\Users\360\Downloads\inventory\src\app\(public)\orders\page.tsx` (`'use client'`).
- Rewrite `c:\Users\360\Downloads\inventory\src\app\(public)\orders\[orderId]\page.tsx` (server, `force-dynamic`) + create `c:\Users\360\Downloads\inventory\src\components\order-timeline.tsx` (`'use client'`).
Verify: `npx tsc --noEmit` exits 0.

## Final verification (convergence)
- `npx prisma generate` exits 0.
- `npx tsc --noEmit` exits 0.
- `npm run build` exits 0 (with Cache Components off and all pages migrated, the build is green; `images.domains` deprecation and `middleware` deprecation are warnings only — allowed).
- `npm run lint` — no errors (warnings allowed).
- Commit each feature with a descriptive message; never push.

## Files NOT to touch
`prisma/schema.prisma`, `src/lib/prisma.ts`, `src/lib/utils.ts`, `src/lib/auth.ts`, `src/middleware.ts`, `prisma/seed.ts`, everything under `src/app/admin/**` and `src/app/api/**`, `src/app/layout.tsx`, all `src/components/ui/*`. The only pre-existing file modified is `next.config.ts` (the two cache flags).
