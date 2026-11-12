import { MessageCircle } from 'lucide-react'
import { useConfig } from '../context/ConfigContext'

export default function WhatsAppButton() {
  const { whatsapp, storeName } = useConfig()
  if (!whatsapp) return null
  const href = `https://wa.me/${whatsapp}?text=${encodeURIComponent(`Assalam o Alaikum! I have a question about ${storeName}.`)}`
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 right-5 z-30 flex h-14 items-center gap-2 rounded-full bg-[#25D366] px-4 font-semibold text-white shadow-lg transition-transform hover:scale-105">
      <MessageCircle className="h-7 w-7 fill-white text-[#25D366]" aria-hidden="true" />
      <span className="hidden sm:inline">Chat with us</span>
    </a>
  )
}
