'use client'
import { useState, useRef } from 'react'
import { Button } from '@/components/ui/Button'

export function PhotoTimeline({ barrelId, photos: initialPhotos }: { barrelId: string; photos: string[] }) {
  const [photos, setPhotos] = useState(initialPhotos)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function upload(file: File) {
    setUploading(true)
    setError('')
    const formData = new FormData()
    formData.append('photo', file)
    formData.append('barrelId', barrelId)

    try {
      const res = await fetch('/api/photos/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.url) setPhotos((p) => [...p, data.url])
      else setError(data.error || 'Upload failed')
    } catch {
      setError('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-3">
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((url, i) => (
            <img key={i} src={url} alt={`Barrel photo ${i + 1}`} className="w-full aspect-square object-cover rounded-lg" />
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f) }}
      />

      <Button
        variant="secondary"
        size="sm"
        onClick={() => inputRef.current?.click()}
        loading={uploading}
        className="w-full"
      >
        {photos.length === 0 ? 'Add first photo' : '+ Add photo'}
      </Button>

      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}
