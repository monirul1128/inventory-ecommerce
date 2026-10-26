# 🛋️ Furniture E-Commerce + POS System

A full-stack Next.js 14 application combining a customer-facing furniture e-commerce website with a complete Point of Sale (POS) admin panel for furniture stores.

## ✨ Features (40+)

### 🛍️ Customer Website
- **Homepage** - Hero banner, featured products, categories, new arrivals, best sellers
- **Shop** - Product listing with filters (category, price range), search, pagination
- **Product Detail** - Images, descriptions, add to cart, buy now, related products
- **Shopping Cart** - View items, update quantity, remove items
- **Checkout** - Customer info, address, payment method (COD/Bkash/Nagad)
- **Order Tracking** - Search orders by phone number, view order status

### ⚙️ Admin Panel (`/admin`)

#### Product Management
- Categories & subcategories (CRUD)
- **Products** - Add/edit/delete with:
  - **Smart Image Upload** - Drag & drop or click to upload
  - **Auto WebP Conversion** - Automatic compression & format conversion
  - **Image Optimization** - Auto-resize to max 1200px, 85% quality
  - SKU & Barcode auto-generation
  - Stock management, pricing
  - Multiple images per product (up to 5)
- Suppliers & customers management
- Low stock & expiry alerts

#### Sales & POS
- **POS System** - Barcode scanning, quick cart, multiple payment methods (Cash/Bkash/Nagad/Card/Credit)
- Sales history with filters
- Sales returns
- Invoice generation (print, PDF, WhatsApp share)

#### Purchase Management
- Purchase entry with invoice number
- Purchase history
- Purchase returns

#### Inventory & Stock
- Current stock overview
- Stock movements (in/out/damage/return)
- Low stock alerts
- Expiry date alerts
- Damaged stock tracking

#### Financial Management
- Customer & supplier ledgers (dues tracking)
- Payment collection & payments
- Daily cash register (open/close)
- Daily expenses tracking
- Discount & VAT handling

#### Reports & Analytics
- Daily profit/loss report (auto-calculated)
- Monthly reports with charts
- Yearly reports
- Top-selling products
- Dashboard with KPIs

#### User Management
- Employee management
- Salary tracking & payment
- Role-based access (Admin/Staff)
- Admin & Staff login

#### Utilities
- Data backup & restore
- Password change
- WhatsApp/SMS reminders for dues

## 🚀 Tech Stack

- **Framework:** Next.js 14 (App Router, TypeScript)
- **Database:** PostgreSQL (Neon)
- **ORM:** Prisma 5
- **Auth:** NextAuth.js v5
- **UI:** Tailwind CSS v4 + shadcn/ui
- **State:** Zustand (cart management)
- **Charts:** Recharts
- **PDF:** jsPDF + jspdf-autotable
- **Barcode:** react-barcode, @zxing/browser
- **Deployment:** Vercel

## 📦 Installation

### 1. Clone the repository
```bash
git clone https://github.com/monirul1128/inventory-ecommerce.git
cd inventory-ecommerce
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup environment variables
Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
NEXTAUTH_SECRET="your-random-32-character-secret"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

### 4. Setup database
```bash
# Run migrations
npx prisma migrate dev

# Seed initial data (admin user, sample products)
npx prisma db seed
```

### 5. Run development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔑 Default Login Credentials

- **Email:** admin@shop.com
- **Password:** admin123

⚠️ **Change these credentials immediately in production!**

## 📂 Project Structure

```
inventory-ecommerce/
├── prisma/
│   ├── schema.prisma          # Database schema (20 models)
│   ├── seed.ts                # Seed data with furniture items
│   └── migrations/            # Database migrations
├── src/
│   ├── app/
│   │   ├── (public)/          # Customer-facing pages
│   │   │   ├── page.tsx       # Homepage
│   │   │   ├── shop/          # Shop & category pages
│   │   │   ├── product/[id]/  # Product detail
│   │   │   ├── cart/          # Shopping cart
│   │   │   ├── checkout/      # Checkout page
│   │   │   └── orders/        # Order tracking
│   │   ├── admin/             # Admin panel
│   │   │   ├── login/         # Admin login
│   │   │   └── (protected)/   # Protected admin pages
│   │   └── api/               # API routes (35+ endpoints)
│   ├── components/            # Reusable components
│   │   ├── admin-sidebar.tsx
│   │   ├── site-navbar.tsx
│   │   ├── product-card.tsx
│   │   └── cart-provider.tsx
│   └── lib/
│       ├── prisma.ts          # Prisma client
│       ├── auth.ts            # NextAuth config
│       ├── cart-store.ts      # Zustand cart store
│       └── utils.ts           # Utility functions
├── .env                       # Environment variables (not in git)
├── .env.example               # Environment template
├── next.config.ts             # Next.js configuration
└── package.json
```

## 🌐 Deployment on Vercel

### 1. Push to GitHub
```bash
git push origin main
```

### 2. Import to Vercel
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Add environment variables in Vercel dashboard:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (your vercel domain)
   - `NEXT_PUBLIC_SITE_URL` (your vercel domain)

### 3. Deploy
Click "Deploy" and wait 2-3 minutes. Your app will be live!

## 🗄️ Database Setup (Neon PostgreSQL)

1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Add it to `.env` as `DATABASE_URL`
5. Run migrations: `npx prisma migrate deploy`

## 📊 Database Schema

The application uses 20 Prisma models including:
- User (Admin/Staff roles)
- Category (with subcategories)
- Product (with barcode, SKU, stock tracking)
- Customer & Supplier
- Purchase & Sale (with line items)
- Order (e-commerce orders)
- Payment, Expense, CashRegister
- StockMovement, DamagedStock
- Employee & EmployeeSalary

## 🔒 Security Features

- NextAuth.js authentication
- Role-based access control (Admin/Staff)
- Protected API routes
- Middleware route protection
- Password hashing with bcrypt
- Session management

## 🎨 UI/UX Features

- Responsive design (mobile, tablet, desktop)
- Bengali language support throughout
- Warm furniture-store color palette (amber/orange tones)
- Loading states & skeleton screens
- Toast notifications
- Print-friendly invoice layouts
- Dark/light theme compatible

## 📱 Mobile Responsive

All pages are fully responsive with:
- Collapsible sidebar navigation
- Mobile-optimized POS interface
- Touch-friendly buttons and forms
- Bottom sheet filters on mobile

## 🧪 Testing

Build the project to ensure everything works:
```bash
npm run build
```

## 📝 License

MIT License - feel free to use this project for your own furniture store!

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 👨‍💻 Author

**Monirul Islam**
- GitHub: [@monirul1128](https://github.com/monirul1128)

## 🙏 Acknowledgments

- Built with Next.js 14 App Router
- UI components from shadcn/ui
- Icons from Lucide React
- Deployment on Vercel
- Database on Neon PostgreSQL

---

Made with ❤️ for furniture stores in Bangladesh
