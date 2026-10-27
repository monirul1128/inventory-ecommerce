# Test Login - Debug Steps

## Step 1: Check if user exists and verify password

Open browser console and run:

```javascript
fetch('https://inventory-ecommerce-five.vercel.app/api/debug/verify-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@shop.com',
    password: 'admin123'
  })
})
.then(r => r.json())
.then(data => console.log('Password Check:', data))
```

Expected result:
```json
{
  "success": true,
  "passwordMatch": true
}
```

If `passwordMatch: false`, then the password hash in database is wrong.

## Step 2: If password is wrong, recreate admin user

Run this in browser console:

```javascript
fetch('https://inventory-ecommerce-five.vercel.app/api/debug/seed-admin', {
  method: 'POST'
})
.then(r => r.json())
.then(data => console.log('Seed Result:', data))
```

## Step 3: Check Vercel Function Logs

Go to: Vercel Dashboard → Your Project → Logs → Function Logs

Filter: `/api/admin-login`

Look for:
- `[Admin Login] User not found` - User doesn't exist
- `[Admin Login] Invalid password` - Password doesn't match
- `[Admin Login] Success` - Should work

## Possible Issues:

1. **Database seed ran but password hash changed** - Solution: Re-seed
2. **User exists but password hash corrupted** - Solution: Re-create user
3. **bcrypt version mismatch** - Solution: Check bcrypt version consistency
