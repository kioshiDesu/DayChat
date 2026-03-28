'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useIdentity } from '@/components/providers/identity-provider'
import { MessageBubble } from './message-bubble'
import { MessageInput } from './message-input'
import { ShareModal } from '@/components/room/share-modal'
import { MessageActions } from './message-actions'
import { RoomSettings } from './room-settings'
import { db, LocalMessage } from '@/lib/db/daychat-db'
import { sendMessage, loadMessages, subscribeToMessages } from '@/lib/messages/sync-service'
import { ChevronLeft, Settings, MoreVertical, Pin } from 'lucide-react'
import { ExpiryCountdown } from '@/components/room/expiry-countdown'

export function ChatInterface() {
  const params = useParams()
  const router = useRouter()
  const roomId = params.id as string
  const { identity } = useIdentity()
  const [messages, setMessages] = useState<LocalMessage[]>([])
  const [room, setRoom] = useState<any>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [replyingTo, setReplyingTo] = useState<LocalMessage | null>(null)
  const [selectedMessage, setSelectedMessage] = useState<LocalMessage | null>(null)
  const [showActions, setShowActions] = useState(false)
  const [isPinned, setIsPinned] = useState<Record<string, boolean>>({})
  const scrollRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number>(0)
  const touchEndX = useRef<number>(0)

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
  }, [messages.length])

  const loadRoom = async () => {
    const supabase = (await import('@/lib/supabase/client')).createClient()
    const { data } = await supabase.from('rooms').select('*').eq('id', roomId).single()
    setRoom(data)
  }

  const handleSendMessage = async (content: string) => {
    if (!identity) return
    try {
      let finalContent = content
      if (replyingTo) {
        finalContent = `Replying to ${replyingTo.display_name}: ${content}`
      }
      await sendMessage(roomId, finalContent, { displayName: identity.displayName })
      setReplyingTo(null)
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleLongPress = useCallback((message: LocalMessage) => {
    setSelectedMessage(message)
    setShowActions(true)
  }, [])

  const handleSwipeReply = useCallback((message: LocalMessage) => {
    setReplyingTo(message)
  }, [])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent, message: LocalMessage) => {
    const swipeDistance = touchEndX.current - touchStartX.current
    if (swipeDistance > 50) {
      handleSwipeReply(message)
    }
    touchStartX.current = 0
    touchEndX.current = 0
  }

  const handleUpdateTitle = async (newTitle: string) => {
    const supabase = (await import('@/lib/supabase/client')).createClient()
    const result = await (supabase.from('rooms') as any).update({ title: newTitle }).eq('id', roomId).select()
    if (result.data && result.data.length > 0) {
      setRoom({ ...room, title: newTitle })
    }
    setShowSettings(false)
  }

  const handleDeleteRoom = async () => {
    if (!confirm('Are you sure you want to delete this room? This cannot be undone.')) return
    const supabase = (await import('@/lib/supabase/client')).createClient()
    await (supabase.from('rooms') as any).delete().eq('id', roomId)
    router.push('/home')
  }

  const handleDeleteMessage = async () => {
    if (!selectedMessage || !identity) return
    // Check if user owns this message (by display name) or is room creator
    const isOwner = selectedMessage.display_name === identity.displayName
    if (!isOwner && !isCreator) {
      alert('You can only delete your own messages')
      return
    }
    
    const supabase = (await import('@/lib/supabase/client')).createClient()
    await (supabase.from('messages') as any).delete().eq('id', selectedMessage.id)
    // Mark as deleted locally (don't remove)
    setMessages(prev => prev.map(m => 
      m.id === selectedMessage.id 
        ? { ...m, deleted: true, content: '(Deleted message)', expired: true }
        : m
    ))
    setShowActions(false)
    setSelectedMessage(null)
  }

  const handlePinMessage = () => {
    if (!selectedMessage) return
    setIsPinned(prev => ({
      ...prev,
      [selectedMessage.id]: !prev[selectedMessage.id]
    }))
    setShowActions(false)
  }

  if (!room || !identity) return null

  const isCreator = room.creator_anon_id === identity.displayName

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
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold truncate">{room.title}</h2>
              <p className="text-xs text-muted-foreground">
                <ExpiryCountdown expiresAt={room.expires_at} className="inline" />
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!room.is_public && (
              <button 
                onClick={() => setShowShareModal(true)} 
                className="text-sm text-primary p-2"
              >
                Share
              </button>
            )}
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Reply Preview */}
      {replyingTo && (
        <div className="bg-muted/50 border-b p-3 flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">
              Replying to {replyingTo.display_name}
            </p>
            <p className="text-sm truncate">{replyingTo.content}</p>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1 hover:bg-muted rounded"
          >
            <ChevronLeft className="h-4 w-4 rotate-90" />
          </button>
        </div>
      )}

      {/* Messages */}
      <div 
        ref={scrollRef} 
        className="flex-1 overflow-auto p-4 space-y-3 pb-[env(safe-area-inset-bottom)]"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={(e) => handleTouchEnd(e, message)}
            onContextMenu={(e) => {
              e.preventDefault()
              handleLongPress(message)
            }}
          >
            <MessageBubble
              message={message}
              isOwn={message.display_name === identity.displayName}
              canDelete={isCreator}
              showName={!isPinned[message.id]}
              isPinned={isPinned[message.id]}
              onLongPress={() => handleLongPress(message)}
            />
            {isPinned[message.id] && (
              <div className="flex items-center gap-1 text-xs text-primary mt-1 ml-1">
                <Pin className="h-3 w-3 fill-current" />
                <span>Pinned</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="sticky bottom-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-[env(safe-area-inset-bottom)]">
        <MessageInput 
          onSend={handleSendMessage}
          replyingTo={replyingTo?.display_name}
          onCancelReply={() => setReplyingTo(null)}
        />
      </div>

      {/* Message Actions Menu */}
      {selectedMessage && (
        <MessageActions
          message={selectedMessage}
          isOwn={selectedMessage.display_name === identity.displayName}
          isCreator={isCreator}
          isOpen={showActions}
          onClose={() => { setShowActions(false); setSelectedMessage(null) }}
          onReply={() => setReplyingTo(selectedMessage)}
          onEdit={() => console.log('Edit message')}
          onDelete={handleDeleteMessage}
          onPin={handlePinMessage}
          isPinned={isPinned[selectedMessage.id]}
        />
      )}

      {/* Room Settings */}
      <RoomSettings
        room={room}
        open={showSettings}
        onOpenChange={setShowSettings}
        onUpdateTitle={handleUpdateTitle}
        onDeleteRoom={handleDeleteRoom}
        isCreator={isCreator}
      />

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
