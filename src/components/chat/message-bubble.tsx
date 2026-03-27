'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Lock, User, Pin, Trash2 } from 'lucide-react'
import { LocalMessage } from '@/lib/db/daychat-db'

interface MessageBubbleProps {
  message: LocalMessage
  isOwn: boolean
  canDelete: boolean
  showName?: boolean
  isPinned?: boolean
  onLongPress?: () => void
}

export function MessageBubble({ 
  message, 
  isOwn, 
  canDelete, 
  showName = true,
  isPinned = false,
  onLongPress,
}: MessageBubbleProps) {
  const [touchTimer, setTouchTimer] = useState<NodeJS.Timeout | null>(null)

  const handleTouchStart = () => {
    const timer = setTimeout(() => {
      onLongPress?.()
    }, 500)
    setTouchTimer(timer)
  }

  const handleTouchEnd = () => {
    if (touchTimer) {
      clearTimeout(touchTimer)
      setTouchTimer(null)
    }
  }

  // Show deleted message placeholder
  if (message.deleted) {
    return (
      <div className={cn('flex flex-col', isOwn ? 'items-end' : 'items-start')}>
        <div className="max-w-[80%] rounded-2xl px-4 py-2 bg-muted/50 opacity-50">
          <p className="text-sm italic text-muted-foreground">
            <Trash2 className="h-3 w-3 inline mr-1" />
            (Deleted message)
          </p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={cn('flex flex-col', isOwn ? 'items-end' : 'items-start')}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {showName && !isOwn && (
        <div className="flex items-center gap-1 mb-1 ml-1">
          <User className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-medium">{message.display_name}</span>
        </div>
      )}
      <div 
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2 relative transition-all',
          isOwn ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white' : 'bg-muted',
          message.expired && 'opacity-60 grayscale',
          isPinned && 'ring-2 ring-primary'
        )}
      >
        {isPinned && (
          <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1">
            <Pin className="h-3 w-3 fill-current" />
          </div>
        )}
        {message.expired && (
          <div className="flex items-center gap-1 text-xs mb-1 opacity-70">
            <Lock className="h-3 w-3" />
            <span>Expired (local only)</span>
          </div>
        )}
        <p className="text-sm break-words">{message.content}</p>
        <p className={cn('text-xs mt-1', isOwn ? 'text-white/70' : 'text-muted-foreground')}>
          {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}
