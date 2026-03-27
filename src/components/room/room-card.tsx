'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Users, Clock, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RoomCardProps {
  id: string
  title: string
  description: string | null
  is_public: boolean
  expires_at: string
  participant_count?: number
}

export function RoomCard({ id, title, description, is_public, expires_at, participant_count }: RoomCardProps) {
  const [timeRemaining, setTimeRemaining] = useState('')

  useEffect(() => {
    const updateRemaining = () => {
      const expires = new Date(expires_at)
      const now = new Date()
      const diff = expires.getTime() - now.getTime()
      if (diff <= 0) { setTimeRemaining('Expired') }
      else {
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        setTimeRemaining(`${hours}h ${minutes}m`)
      }
    }
    updateRemaining()
    const interval = setInterval(updateRemaining, 60000)
    return () => clearInterval(interval)
  }, [expires_at])

  const isExpiringSoon = timeRemaining !== 'Expired' && new Date(expires_at).getTime() - Date.now() < 2 * 60 * 60 * 1000

  return (
    <Link href={`/room/${id}`}>
      <Card className="hover:bg-accent transition-colors">
        <CardContent className="p-4 space-y-2">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{title}</h3>
                {!is_public && <Lock className="h-3 w-3 text-muted-foreground" />}
              </div>
              {description && <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className={cn('h-3 w-3', isExpiringSoon && 'text-orange-500')} />
              <span className={isExpiringSoon ? 'text-orange-500' : ''}>{timeRemaining}</span>
            </div>
            {participant_count !== undefined && (
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" /><span>{participant_count}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
