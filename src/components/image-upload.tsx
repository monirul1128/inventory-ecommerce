'use client'
import { useState, useRef, useEffect } from 'react'
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'

interface ImageUploadProps {
  images: string[]
  onChange: (images: string[]) => void
  maxImages?: number
}

export function ImageUpload({ images, onChange, maxImages = 5 }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Debug: log when images prop changes
  useEffect(() => {
    console.log('ImageUpload received images:', images)
  }, [images])

  const convertToWebP = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        // Max dimensions
        const MAX_WIDTH = 1200
        const MAX_HEIGHT = 1200
        
        let width = img.width
        let height = img.height
        
        // Calculate new dimensions
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height
            height = MAX_HEIGHT
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        ctx?.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob)
            else reject(new Error('Canvas to Blob conversion failed'))
          },
          'image/webp',
          0.85 // Quality 85%
        )
      }
      img.onerror = () => reject(new Error('Image load failed'))
      img.src = URL.createObjectURL(file)
    })
  }

  const uploadToServer = async (blob: Blob): Promise<string> => {
    const formData = new FormData()
    formData.append('file', blob, 'image.webp')

    console.log('Uploading to /api/upload...')

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    console.log('Upload response status:', res.status)

    if (!res.ok) {
      const error = await res.json()
      console.error('Upload error response:', error)
      throw new Error(error.error || 'Upload failed')
    }

    const data = await res.json()
    console.log('Upload successful:', data.url)
    return data.url
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    if (images.length >= maxImages) {
      toast.error(`সর্বোচ্চ ${maxImages}টি ছবি যোগ করতে পারবেন`)
      return
    }

    const remainingSlots = maxImages - images.length
    const filesToProcess = Array.from(files).slice(0, remainingSlots)

    setUploading(true)
    const newImages: string[] = []

    try {
      for (const file of filesToProcess) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} একটি ছবি নয়`)
          continue
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} অনেক বড় (সর্বোচ্চ 10MB)`)
          continue
        }

        // Convert to WebP
        const webpBlob = await convertToWebP(file)
        
        // Upload to server
        const url = await uploadToServer(webpBlob)
        newImages.push(url)
      }

      if (newImages.length > 0) {
        onChange([...images, ...newImages])
        toast.success(`${newImages.length}টি ছবি যোগ হয়েছে`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      const errorMsg = error instanceof Error ? error.message : 'ছবি আপলোড করতে সমস্যা হয়েছে'
      toast.error(errorMsg)
    } finally {
      setUploading(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFiles(e.dataTransfer.files)
  }

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index))
    toast.success('ছবি সরানো হয়েছে')
  }

  return (
    <div className="space-y-3">
      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${dragActive ? 'border-amber-500 bg-amber-50' : 'border-gray-300 hover:border-amber-400'}
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          disabled={uploading || images.length >= maxImages}
        />
        
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-10 h-10 text-amber-600 animate-spin" />
            <p className="text-sm text-gray-600">আপলোড হচ্ছে...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-10 h-10 text-gray-400" />
            <p className="text-sm font-medium text-gray-700">
              ছবি আপলোড করতে ক্লিক করুন বা ড্র্যাগ করুন
            </p>
            <p className="text-xs text-gray-500">
              PNG, JPG, WEBP (সর্বোচ্চ 10MB) • স্বয়ংক্রিয়ভাবে WebP তে রূপান্তরিত হবে
            </p>
            <p className="text-xs text-amber-600">
              {images.length}/{maxImages} টি ছবি যোগ করা হয়েছে
            </p>
          </div>
        )}
      </div>

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((url, index) => (
            <div key={index} className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
              <Image
                src={url}
                alt={`ছবি ${index + 1}`}
                fill
                sizes="200px"
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">এখনও কোনো ছবি যোগ করা হয়নি</p>
        </div>
      )}
    </div>
  )
}
