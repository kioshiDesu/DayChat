'use client'

import { cn } from '@/lib/utils'
import { Lock } from 'lucide-react'
import { LocalMessage } from '@/lib/db/daychat-db'

interface MessageBubbleProps {
  message: LocalMessage
  isOwn: boolean
  canDelete: boolean
}

export function MessageBubble({ message, isOwn, canDelete }: MessageBubbleProps) {
  const isExpired = message.expired

  return (
    <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
      <div className={cn(
        'max-w-[80%] rounded-2xl px-4 py-2 relative transition-all',
        isOwn ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white' : 'bg-muted',
        isExpired && 'opacity-60 grayscale'
      )}>
        {isExpired && (
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
