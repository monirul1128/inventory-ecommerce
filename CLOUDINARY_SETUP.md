# Cloudinary Setup Guide

এই প্রজেক্টে ছবি আপলোডের জন্য Cloudinary ব্যবহার করা হয়েছে।

## ✨ কেন Cloudinary?

- ✅ **Free Tier:** 25GB bandwidth/month, unlimited storage
- ✅ **Auto WebP:** Automatic format conversion for best compression
- ✅ **CDN:** Fast delivery worldwide
- ✅ **Transformations:** Resize, crop, optimize on-the-fly
- ✅ **Vercel Compatible:** Works perfectly on serverless

---

## 🚀 Setup Steps

### 1. Cloudinary Account তৈরি করুন

1. যান: https://cloudinary.com/users/register_free
2. Sign up করুন (Email বা Google দিয়ে)
3. Email verify করুন

### 2. API Credentials নিন

Dashboard এ যাওয়ার পর:

1. **Cloud Name** দেখবেন (উপরে)
2. **API Key** এবং **API Secret** পাবেন "Product Environment Credentials" এ

Screenshot:
```
Cloud name: your-cloud-name
API Key: 123456789012345
API Secret: abcdefghijklmnopqrstuvwxyz
```

### 3. Environment Variables যোগ করুন

#### Local Development (`.env`)

`.env` ফাইলে যোগ করুন:

```env
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

#### Vercel Production

1. Vercel Dashboard → Your Project
2. **Settings** → **Environment Variables**
3. Add করুন:
   - `CLOUDINARY_CLOUD_NAME` = your-cloud-name
   - `CLOUDINARY_API_KEY` = your-api-key
   - `CLOUDINARY_API_SECRET` = your-api-secret
4. **Redeploy** করুন

---

## 📂 Upload Settings

ছবি আপলোড হবে `furniture-shop/` folder এ।

**Transformations:**
- Max size: 1200x1200px
- Quality: Auto (optimized)
- Format: Auto WebP conversion
- CDN: Enabled

**Cloudinary Dashboard** এ গিয়ে **Media Library** তে সব ছবি দেখতে পারবেন।

---

## 🧪 Test করুন

1. Admin Panel এ যান: `/admin/products/add`
2. "পণ্যের ছবি" section এ ছবি upload করুন
3. সফল হলে Cloudinary URL পাবেন: `https://res.cloudinary.com/your-cloud-name/image/upload/...`

---

## 📊 Free Tier Limits

| Feature | Free Tier |
|---|---|
| Storage | Unlimited |
| Bandwidth | 25 GB/month |
| Transformations | 25 credits/month |
| Images | Unlimited |

**25GB bandwidth** মানে প্রায় **25,000+ product page views/month** (প্রতি image 1MB ধরে)।

---

## 🔧 Troubleshooting

### Error: "Invalid signature"
- Check করুন API Secret সঠিক আছে কিনা
- Vercel এ redeploy করুন

### Error: "Upload failed"
- Cloud Name, API Key check করুন
- Internet connection check করুন
- Cloudinary dashboard এ usage limit check করুন

### ছবি দেখা যাচ্ছে না
- Browser console এ error check করুন
- Cloudinary Media Library তে ছবি আছে কিনা দেখুন
- URL correct কিনা verify করুন

---

## 📚 More Info

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Node.js SDK](https://cloudinary.com/documentation/node_integration)
- [Image Transformations](https://cloudinary.com/documentation/image_transformations)

---

**Happy Uploading! 🎉**
