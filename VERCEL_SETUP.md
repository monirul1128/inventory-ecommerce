# Vercel Deployment Setup

## Admin Login Issue Fix

### Problem
Admin login not working on Vercel because:
1. Database migrations not applied
2. Seed data (admin user) not created
3. Environment variables might be missing

### Solution

#### 1. Check Database Status

Visit this endpoint to check if users exist:
```
https://inventory-ecommerce-five.vercel.app/api/debug/users
```

Expected response:
```json
{
  "success": true,
  "count": 2,
  "users": [
    { "email": "admin@shop.com", "role": "ADMIN" },
    { "email": "staff@shop.com", "role": "STAFF" }
  ]
}
```

If `count: 0`, then seed data is missing.

#### 2. Verify Environment Variables

Go to Vercel Dashboard → Settings → Environment Variables

**Required variables:**
```
DATABASE_URL=postgresql://neondb_owner:npg_KCRcFAuo8U3v@ep-dawn-sea-b4a96ujj-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require

NEXTAUTH_SECRET=furniture-pos-secret-2024

NEXTAUTH_URL=https://inventory-ecommerce-five.vercel.app

CLOUDINARY_CLOUD_NAME=slh0kpxk
CLOUDINARY_API_KEY=427534849784186
CLOUDINARY_API_SECRET=pOm0pgbHnUm2Hpri165hJZjrEgU
```

#### 3. Manual Database Setup (If needed)

If automatic migration/seed didn't work, run manually:

**Option A: From local machine**
```bash
# Set Vercel production database URL
DATABASE_URL="postgresql://neondb_owner:npg_KCRcFAuo8U3v@ep-dawn-sea-b4a96ujj-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Run migrations
npx prisma migrate deploy

# Run seed
npx prisma db seed
```

**Option B: Use Neon Console**
Go to https://console.neon.tech/ and run SQL directly

#### 4. Force Redeploy

After updating environment variables:
1. Go to Vercel Deployments
2. Click "..." on latest deployment
3. Click "Redeploy"
4. ✅ **IMPORTANT:** Uncheck "Use existing Build Cache"

#### 5. Test Login

1. Go to: https://inventory-ecommerce-five.vercel.app/admin/login
2. Use credentials:
   - Email: `admin@shop.com`
   - Password: `admin123`
3. Open Browser Console (F12) to see debug logs

### Default Credentials

**Admin:**
- Email: admin@shop.com
- Password: admin123

**Staff:**
- Email: staff@shop.com
- Password: staff123

### Troubleshooting

**Issue: "ইমেইল বা পাসওয়ার্ড সঠিক নয়"**

Check browser console logs:
- If "Attempting login..." but no user found → Database seed missing
- If "Login error: CredentialsSignin" → Wrong password or user doesn't exist
- If "Login successful" but redirect fails → NextAuth session issue

**Issue: Database connection error**

Check:
1. DATABASE_URL is correct in Vercel env vars
2. Neon database is active (not paused)
3. Connection pooling is enabled in Neon

**Issue: NextAuth callback error**

Check:
1. NEXTAUTH_URL matches your Vercel domain
2. NEXTAUTH_SECRET is set
3. All environment variables are in "Production" environment
