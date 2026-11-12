import { useState } from 'react'
import { ImageOff } from 'lucide-react'

export default function ProductImage({ src, alt, className = '' }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return (
      <div className={`flex h-full w-full flex-col items-center justify-center gap-2 bg-green-50 text-green-800 ${className}`}>
        <ImageOff className="h-9 w-9" /><span className="text-sm font-medium">Photo coming soon</span>
      </div>
    )
  }
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className={`h-full w-full object-cover ${className}`} />
}
