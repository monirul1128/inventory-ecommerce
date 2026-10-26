import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(req: NextRequest) {
  try {
    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('Cloudinary credentials missing')
      return NextResponse.json(
        { error: 'Cloudinary কনফিগারেশন সমস্যা। Vercel এ environment variables যোগ করুন।' },
        { status: 500 }
      )
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'কোনো ফাইল পাওয়া যায়নি' }, { status: 400 })
    }

    console.log('Uploading file:', file.name, file.type, file.size, 'bytes')

    // Convert file to base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64String = buffer.toString('base64')
    const dataURI = `data:${file.type};base64,${base64String}`

    console.log('Uploading to Cloudinary...')

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'furniture-shop',
      resource_type: 'auto',
      transformation: [
        { width: 1200, height: 1200, crop: 'limit' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' } // Auto WebP
      ]
    })

    console.log('Upload success:', result.secure_url)

    return NextResponse.json({ url: result.secure_url })
  } catch (error: any) {
    console.error('Cloudinary upload error:', error)
    const errorMessage = error?.message || error?.error?.message || 'ছবি আপলোড করতে সমস্যা হয়েছে'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
