'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Users, Clock, Lock, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RoomCardProps {
  id: string
  title: string
  description: string | null
  is_public: boolean
  expires_at: string
  participant_count?: number
  latestMessage?: string
}

export function RoomCard({ id, title, description, is_public, expires_at, participant_count, latestMessage }: RoomCardProps) {
  const [timeRemaining, setTimeRemaining] = useState('')
  const [urgency, setUrgency] = useState<'normal' | 'warning' | 'danger'>('normal')

  useEffect(() => {
    const updateRemaining = () => {
      const expires = new Date(expires_at).getTime()
      const now = Date.now()
      const diff = expires - now
      
      if (diff <= 0) {
        setTimeRemaining('Expired')
        setUrgency('danger')
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        
        if (hours < 2) setUrgency('warning')
        if (minutes < 30) setUrgency('danger')
        
        setTimeRemaining(hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`)
      }
    }
    
    updateRemaining()
    const interval = setInterval(updateRemaining, 60000)
    return () => clearInterval(interval)
  }, [expires_at])

  return (
    <Link href={`/room/${id}`}>
      <Card className={cn(
        'hover:bg-accent/50 transition-all group',
        urgency === 'danger' && 'border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20'
      )}>
        <CardContent className="p-3 space-y-2">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate group-hover:text-primary transition-colors">{title}</h3>
                {!is_public && <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
              </div>
              {latestMessage ? (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MessageCircle className="h-3 w-3" />
                  <span className="truncate">{latestMessage}</span>
                </div>
              ) : description ? (
                <p className="text-xs text-muted-foreground truncate">{description}</p>
              ) : null}
            </div>
            
            {/* Time badge */}
            <div className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0',
              urgency === 'danger' && 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
              urgency === 'warning' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
              urgency === 'normal' && 'bg-muted text-muted-foreground'
            )}>
              <Clock className={cn('h-3 w-3', urgency === 'danger' && 'animate-pulse')} />
              <span className="whitespace-nowrap">{timeRemaining}</span>
            </div>
          </div>
          
          {/* Footer */}
          {participant_count !== undefined && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1 border-t">
              <Users className="h-3 w-3" />
              <span>{participant_count} {participant_count === 1 ? 'participant' : 'participants'}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
