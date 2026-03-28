'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Users, Clock, Lock, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface Room {
  id: string
  title: string
  description: string | null
  is_public: boolean
  invite_code: string
  expires_at: string
  created_at: string
  creator_anon_id: string
}

interface RoomWithMessage extends Room {
  latestMessage?: string
  messageCount?: number
}

interface RoomListProps {
  rooms: Room[]
}

export function RoomList({ rooms }: RoomListProps) {
  const [roomsWithMessages, setRooms] = useState<RoomWithMessage[]>([])

  useEffect(() => {
    const loadMessages = async () => {
      const supabase = createClient()
      const roomsWithMsg = await Promise.all(
        rooms.map(async (room) => {
          const { data: messages } = await supabase
            .from('messages')
            .select('content')
            .eq('room_id', room.id)
            .order('created_at', { ascending: false })
            .limit(1)

          return {
            ...room,
            latestMessage: messages?.[0]?.content,
            messageCount: messages?.length || 0
          }
        })
      )
      setRooms(roomsWithMsg)
    }

    if (rooms.length > 0) {
      loadMessages()
    }
  }, [rooms])

  return (
    <div className="space-y-2">
      {roomsWithMessages.map((room) => (
        <RoomListItem key={room.id} room={room} />
      ))}
    </div>
  )
}

function RoomListItem({ room }: { room: RoomWithMessage }) {
  const [timeRemaining, setTimeRemaining] = useState('')
  const [urgency, setUrgency] = useState<'normal' | 'warning' | 'danger'>('normal')

  useEffect(() => {
    const updateRemaining = () => {
      const expires = new Date(room.expires_at).getTime()
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
  }, [room.expires_at])

  return (
    <Link href={`/room/${room.id}`}>
      <Card className={cn(
        'hover:bg-accent/50 transition-all group border-l-4',
        urgency === 'danger' && 'border-l-orange-500 bg-orange-50/30 dark:border-l-orange-500 dark:bg-orange-950/10',
        urgency === 'warning' && 'border-l-yellow-500',
        urgency === 'normal' && 'border-l-transparent'
      )}>
        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate group-hover:text-primary transition-colors">{room.title}</h3>
                {!room.is_public && <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
              </div>
              
              {room.latestMessage ? (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MessageCircle className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{room.latestMessage}</span>
                </div>
              ) : room.description ? (
                <p className="text-xs text-muted-foreground truncate">{room.description}</p>
              ) : null}
            </div>
            
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <div className={cn(
                'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                urgency === 'danger' && 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
                urgency === 'warning' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
                urgency === 'normal' && 'bg-muted text-muted-foreground'
              )}>
                <Clock className={cn('h-3 w-3', urgency === 'danger' && 'animate-pulse')} />
                <span className="whitespace-nowrap">{timeRemaining}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
