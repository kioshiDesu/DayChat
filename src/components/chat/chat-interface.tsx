'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useIdentity } from '@/components/providers/identity-provider'
import { MessageBubble } from './message-bubble'
import { MessageInput } from './message-input'
import { ShareModal } from '@/components/room/share-modal'
import { db, LocalMessage } from '@/lib/db/daychat-db'
import { sendMessage, loadMessages, subscribeToMessages } from '@/lib/messages/sync-service'
import { ChevronLeft } from 'lucide-react'

export function ChatInterface() {
  const params = useParams()
  const router = useRouter()
  const roomId = params.id as string
  const { identity } = useIdentity()
  const [messages, setMessages] = useState<LocalMessage[]>([])
  const [room, setRoom] = useState<any>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!identity) return
    
    console.log('ChatInterface: initializing for room', roomId)
    loadRoom()
    
    loadMessages(roomId).then(msgs => {
      console.log('Loaded messages:', msgs.length)
      setMessages(msgs)
    })
    
    const unsubscribe = subscribeToMessages(roomId, (msg, type) => {
      console.log('Received message update:', type, msg.id)
      setMessages(prev => {
        const exists = prev.find(m => m.id === msg.id)
        let updated
        if (exists) {
          console.log('Updating existing message')
          updated = prev.map(m => m.id === msg.id ? msg : m)
        } else {
          console.log('Adding new message')
          updated = [...prev, msg]
        }
        // Sort by created_at
        return updated.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
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
      {/* Header */}
      <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.back()} 
              className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div>
              <h2 className="font-semibold">{room.title}</h2>
              <p className="text-xs text-muted-foreground">
                Expires: {new Date(room.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          {!room.is_public && (
            <button onClick={() => setShowShareModal(true)} className="text-sm text-primary">
              Share
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-auto p-4 space-y-3 pb-[env(safe-area-inset-bottom)]" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwn={message.user_anon_id === identity.anonId}
            canDelete={room.creator_anon_id === identity.anonId}
          />
        ))}
      </div>

      {/* Input */}
      <div className="sticky bottom-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-[env(safe-area-inset-bottom)]">
        <MessageInput onSend={handleSendMessage} />
      </div>

      {/* Share Modal */}
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
