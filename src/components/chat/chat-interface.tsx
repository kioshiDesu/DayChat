'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { useIdentity } from '@/components/providers/identity-provider'
import { MessageBubble } from './message-bubble'
import { MessageInput } from './message-input'
import { ShareModal } from '@/components/room/share-modal'
import { db, LocalMessage } from '@/lib/db/daychat-db'
import { sendMessage, loadMessages, subscribeToMessages } from '@/lib/messages/sync-service'

export function ChatInterface() {
  const params = useParams()
  const roomId = params.id as string
  const { identity } = useIdentity()
  const [messages, setMessages] = useState<LocalMessage[]>([])
  const [room, setRoom] = useState<any>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!identity) return
    loadRoom()
    loadMessages(roomId).then(setMessages)
    const unsubscribe = subscribeToMessages(roomId, (msg, type) => {
      setMessages(prev => {
        const exists = prev.find(m => m.id === msg.id)
        if (exists) {
          return prev.map(m => m.id === msg.id ? msg : m)
        }
        return [...prev, msg]
      })
    })
    return () => unsubscribe()
  }, [roomId, identity])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const loadRoom = async () => {
    const supabase = (await import('@/lib/supabase/client')).createClient()
    const { data } = await supabase.from('rooms').select('*').eq('id', roomId).single()
    setRoom(data)
  }

  const handleSendMessage = async (content: string) => {
    if (!identity) return
    try {
      await sendMessage(roomId, content, identity)
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  if (!room || !identity) return null

  return (
    <div className="flex flex-col h-screen">
      <div className="border-b p-4 bg-background">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">{room.title}</h2>
            <p className="text-xs text-muted-foreground">
              Expires: {new Date(room.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          {!room.is_public && (
            <button onClick={() => setShowShareModal(true)} className="text-sm text-primary">
              Share
            </button>
          )}
        </div>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-auto p-4 space-y-3">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwn={message.user_anon_id === identity.anonId}
            canDelete={room.creator_anon_id === identity.anonId}
          />
        ))}
      </div>
      <MessageInput onSend={handleSendMessage} />
      {room && !room.is_public && (
        <ShareModal
          roomId={room.id}
          inviteCode={room.invite_code}
          open={showShareModal}
          onOpenChange={setShowShareModal}
        />
      )}
    </div>
  )
}
