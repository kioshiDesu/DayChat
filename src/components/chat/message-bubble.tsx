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
        <div className="max-w-[80%] rounded-2xl px-4 py-2 bg-muted/30">
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
      className={cn('flex flex-col max-w-[85%]', isOwn ? 'items-end self-end' : 'items-start self-start')}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Sender name for received messages */}
      {showName && !isOwn && (
        <div className="flex items-center gap-1 mb-1 ml-1">
          <User className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-medium">{message.display_name}</span>
        </div>
      )}
      
      {/* Message bubble */}
      <div
        className={cn(
          'relative px-4 py-2 transition-all',
          isOwn 
            ? 'bg-blue-500 text-white rounded-2xl rounded-br-sm' 
            : 'bg-muted text-foreground rounded-2xl rounded-bl-sm',
          message.expired && 'opacity-50',
          isPinned && 'ring-2 ring-blue-300 dark:ring-blue-700'
        )}
      >
        {/* Pin indicator */}
        {isPinned && (
          <div className="absolute -top-1.5 -right-1.5 bg-blue-500 text-white rounded-full p-1 shadow-sm">
            <Pin className="h-3 w-3 fill-current" />
          </div>
        )}
        
        {/* Expired indicator */}
        {message.expired && (
          <div className="flex items-center gap-1 text-xs mb-1 opacity-70">
            <Lock className="h-3 w-3" />
            <span>Expired</span>
          </div>
        )}
        
        {/* Message content */}
        <p className="text-sm break-words leading-relaxed">{message.content}</p>
        
        {/* Timestamp */}
        <p className={cn('text-xs mt-1', isOwn ? 'text-white/70' : 'text-muted-foreground')}>
          {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}
