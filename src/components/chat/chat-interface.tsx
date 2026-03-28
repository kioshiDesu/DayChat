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
import { ChevronLeft, Settings, Pin, Reply } from 'lucide-react'
import { ExpiryCountdown } from '@/components/room/expiry-countdown'
import { cn } from '@/lib/utils'

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
  const [swipingId, setSwipingId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number>(0)
  const touchEndX = useRef<number>(0)
  const touchStartTime = useRef<number>(0)
  const isLongPress = useRef<boolean>(false)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!identity) return

    loadRoom()
    loadMessages(roomId).then(msgs => setMessages(msgs))

    const unsubscribe = subscribeToMessages(roomId, (msg, type) => {
      setMessages(prev => {
        const exists = prev.find(m => m.id === msg.id)
        let updated
        if (exists) {
          updated = prev.map(m => m.id === msg.id ? msg : m)
        } else {
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

  const handleTouchStart = (e: React.TouchEvent, messageId: string) => {
    touchStartX.current = e.touches[0].clientX
    touchEndX.current = e.touches[0].clientX
    touchStartTime.current = Date.now()
    isLongPress.current = false
    
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true
      const message = messages.find(m => m.id === messageId)
      if (message) handleLongPress(message)
    }, 500)
  }

  const handleTouchMove = (e: React.TouchEvent, messageId: string) => {
    touchEndX.current = e.touches[0].clientX
    const diff = touchEndX.current - touchStartX.current
    
    if (Math.abs(diff) > 10 && longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    
    if (diff > 50) {
      setSwipingId(messageId)
    } else {
      setSwipingId(null)
    }
  }

  const handleTouchEnd = (e: React.TouchEvent, message: LocalMessage) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    
    const diff = touchEndX.current - touchStartX.current
    const duration = Date.now() - touchStartTime.current
    
    setSwipingId(null)
    
    if (!isLongPress.current && diff > 80 && duration < 300) {
      handleSwipeReply(message)
    }
    
    isLongPress.current = false
  }

  const handleDeleteMessage = async () => {
    if (!selectedMessage || !identity) return
    const isOwner = selectedMessage.display_name === identity.displayName
    if (!isOwner && !isCreator) {
      alert('You can only delete your own messages')
      return
    }
    
    const supabase = (await import('@/lib/supabase/client')).createClient()
    await (supabase.from('messages') as any).delete().eq('id', selectedMessage.id)
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
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button 
              onClick={() => router.back()} 
              className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors flex-shrink-0"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold truncate">{room.title}</h2>
              <p className="text-xs text-muted-foreground truncate">
                <ExpiryCountdown expiresAt={room.expires_at} className="inline" />
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {!room.is_public && (
              <button onClick={() => setShowShareModal(true)} className="p-2 hover:bg-muted rounded-full transition-colors">
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

      {/* Messages */}
      <div 
        ref={scrollRef} 
        className="flex-1 overflow-auto p-4 space-y-3 bg-background"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'relative transition-transform duration-200',
              swipingId === message.id && 'translate-x-4'
            )}
            onTouchStart={(e) => handleTouchStart(e, message.id)}
            onTouchMove={(e) => handleTouchMove(e, message.id)}
            onTouchEnd={(e) => handleTouchEnd(e, message)}
            onContextMenu={(e) => {
              e.preventDefault()
              handleLongPress(message)
            }}
          >
            {/* Swipe indicator */}
            {swipingId === message.id && (
              <div className="absolute left-0 top-0 bottom-0 w-16 bg-blue-500/10 rounded-l-2xl flex items-center justify-center">
                <Reply className="h-5 w-5 text-blue-500" />
              </div>
            )}
            
            <MessageBubble
              message={message}
              isOwn={message.display_name === identity.displayName}
              canDelete={isCreator}
              showName={!isPinned[message.id]}
              isPinned={isPinned[message.id]}
              onLongPress={() => handleLongPress(message)}
            />
            {isPinned[message.id] && (
              <div className="flex items-center gap-1 text-xs text-blue-500 mt-1 ml-1">
                <Pin className="h-3 w-3 fill-current" />
                <span>Pinned</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <MessageInput 
        onSend={handleSendMessage}
        replyingTo={replyingTo?.display_name}
        onCancelReply={() => setReplyingTo(null)}
      />

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
        onUpdateTitle={async (newTitle) => {
          const supabase = (await import('@/lib/supabase/client')).createClient()
          await (supabase.from('rooms') as any).update({ title: newTitle }).eq('id', roomId)
          setRoom({ ...room, title: newTitle })
          setShowSettings(false)
        }}
        onDeleteRoom={async () => {
          if (!confirm('Are you sure you want to delete this room? This cannot be undone.')) return
          const supabase = (await import('@/lib/supabase/client')).createClient()
          await (supabase.from('rooms') as any).delete().eq('id', roomId)
          router.push('/home')
        }}
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
