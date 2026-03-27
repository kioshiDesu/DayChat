'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useSupabase } from '@/components/providers/supabase-provider'
import { MessageBubble } from './message-bubble'
import { MessageInput } from './message-input'
import { ShareModal } from '@/components/room/share-modal'

interface Message { id: string; room_id: string; user_id: string; content: string; expires_at: string; created_at: string }

export function ChatInterface() {
  const params = useParams()
  const roomId = params.id as string
  const { user } = useSupabase()
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>([])
  const [room, setRoom] = useState<any>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => { loadRoom(); loadMessages(); subscribeToMessages(); return () => { supabase.removeChannel() } }, [roomId])

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight }, [messages])

  const loadRoom = async () => {
    const { data } = await supabase.from('rooms').select('*').eq('id', roomId).single()
    setRoom(data)
  }

  const loadMessages = async () => {
    const { data } = await supabase.from('messages').select('*').eq('room_id', roomId).order('created_at', { ascending: true })
    if (data) setMessages(data)
  }

  const subscribeToMessages = () => {
    const channel = supabase.channel(`room:${roomId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message])
      })
      .subscribe()
  }

  const handleSendMessage = async (content: string) => {
    if (!user) return
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)
    await supabase.from('messages').insert({ room_id: roomId, user_id: user.id, content, expires_at: expiresAt.toISOString() })
  }

  const handleDeleteMessage = async (messageId: string) => {
    await supabase.from('messages').delete().eq('id', messageId)
  }

  if (!room) return null

  return (
    <div className="flex flex-col h-screen">
      <div className="border-b p-4 bg-background">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">{room.title}</h2>
            <p className="text-xs text-muted-foreground">Expires: {new Date(room.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          {!room.is_public && <button onClick={() => setShowShareModal(true)} className="text-sm text-primary">Share</button>}
        </div>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-auto p-4 space-y-3">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} isOwn={message.user_id === user?.id} canDelete={room.creator_id === user?.id} onDelete={handleDeleteMessage} />
        ))}
      </div>
      <MessageInput onSend={handleSendMessage} />
      {room && !room.is_public && <ShareModal roomId={room.id} inviteCode={room.invite_code} open={showShareModal} onOpenChange={setShowShareModal} />}
    </div>
  )
}
