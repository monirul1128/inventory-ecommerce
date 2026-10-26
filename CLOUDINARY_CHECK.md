# Cloudinary Setup Checklist

## ছবি আপলোড সমস্যা সমাধান

**Last Updated:** $(date)

### ⚠️ Important: Project-Level Environment Variables

Vercel এ **Team Variables** কাজ না করলে **Project-Specific Variables** যোগ করুন।

### ১. Vercel Environment Variables চেক করুন

Vercel Dashboard → Your Project → Settings → Environment Variables

নিচের তিনটি variable যোগ করুন:

```
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### ২. Cloudinary Account Setup

1. https://cloudinary.com/users/register_free এ যান
2. Free account তৈরি করুন (free tier: 25GB storage, 25GB bandwidth/month)
3. Dashboard থেকে credentials copy করুন:
   - Cloud Name
   - API Key
   - API Secret

### ৩. Local Development Test

Terminal এ চালান:

```bash
npm run dev
```

Browser console (F12) খুলে দেখুন কোন error আসছে কিনা।

### ৪. Common Errors

#### Error: "Cloudinary কনফিগারেশন সমস্যা"
**সমাধান:** Vercel এ environment variables যোগ করুন এবং redeploy করুন

#### Error: "Invalid signature"
**সমাধান:** API Secret ভুল আছে। আবার copy করে Vercel এ paste করুন

#### Error: "Upload failed"
**সমাধান:** 
- Internet connection check করুন
- File size 10MB এর কম কিনা দেখুন
- Browser console এ বিস্তারিত error দেখুন

### ৫. Vercel Logs দেখুন

```bash
vercel logs
```

অথবা Vercel Dashboard → Your Project → Logs

### ৬. Test করুন

1. https://inventory-ecommerce-five.vercel.app/admin/categories এ যান
2. নতুন ক্যাটাগরি তৈরি করুন
3. একটি ছবি আপলোড করুন
4. Browser console (F12 চাপুন) দেখুন error log আছে কিনা

## Debugging Steps

যদি এখনও কাজ না করে:

1. Browser Console (F12) খুলুন
2. Network tab এ যান
3. একটি ছবি আপলোড করার চেষ্টা করুন
4. `/api/upload` request টি ক্লিক করুন
5. Response দেখুন - কি error message আসছে?
6. সেই error message আমাকে জানান

## Alternative: Vercel Blob (Paid)

যদি Cloudinary কাজ না করে, Vercel Blob ব্যবহার করতে পারেন:

```bash
npm install @vercel/blob
```

তবে এটি paid (free tier: 5GB)
