'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Trash2 } from 'lucide-react'

interface Message {
  id: string
  user_id: string
  content: string
  expires_at: string
  created_at: string
}

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  canDelete: boolean
  onDelete: (id: string) => void
}

export function MessageBubble({ message, isOwn, canDelete, onDelete }: MessageBubbleProps) {
  const [opacity, setOpacity] = useState(1)

  useEffect(() => {
    const updateOpacity = () => {
      const now = Date.now()
      const created = new Date(message.created_at).getTime()
      const expires = new Date(message.expires_at).getTime()
      const total = expires - created
      const elapsed = now - created
      const remaining = 1 - (elapsed / total)
      setOpacity(Math.max(0.4, Math.min(1, remaining)))
    }
    updateOpacity()
    const interval = setInterval(updateOpacity, 10000)
    return () => clearInterval(interval)
  }, [message.created_at, message.expires_at])

  return (
    <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')} style={{ transition: 'opacity 0.3s ease' }}>
      <div className={cn('max-w-[80%] rounded-2xl px-4 py-2 relative', isOwn ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white' : 'bg-muted')} style={{ opacity }}>
        <p className="text-sm break-words">{message.content}</p>
        <p className={cn('text-xs mt-1', isOwn ? 'text-white/70' : 'text-muted-foreground')}>{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        {canDelete && !isOwn && (
          <button onClick={() => onDelete(message.id)} className="absolute top-1 right-1 p-1 hover:bg-black/10 rounded">
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  )
}
