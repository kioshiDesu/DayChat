# Phase 5: Chat Interface & Real-Time Messaging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement real-time chat interface with message bubbles, input component, and chat interface for DayChat rooms

**Architecture:** Create three React components (MessageBubble, MessageInput, ChatInterface) and a room page that displays the chat interface with Supabase real-time subscriptions for live messaging

**Tech Stack:** React 19, Next.js 16, Supabase (real-time subscriptions), TypeScript, Tailwind CSS, shadcn/ui components

---

### Task 5.1: Create Message Bubble Component

**Files:**
- Create: `src/components/chat/message-bubble.tsx`

- [ ] **Step 1: Create chat directory**

```bash
mkdir -p /data/data/com.termux/files/home/test/daychat/src/components/chat
```

- [ ] **Step 2: Create message-bubble.tsx**

```typescript
'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Trash2 } from 'lucide-react'

interface Message {
  id: string
  user_id: string
  content: string
  expires_at: string
  created_at: string
}

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  canDelete: boolean
  onDelete: (id: string) => void
}

export function MessageBubble({ message, isOwn, canDelete, onDelete }: MessageBubbleProps) {
  const [opacity, setOpacity] = useState(1)

  useEffect(() => {
    const updateOpacity = () => {
      const now = Date.now()
      const created = new Date(message.created_at).getTime()
      const expires = new Date(message.expires_at).getTime()
      const total = expires - created
      const elapsed = now - created
      const remaining = 1 - (elapsed / total)
      setOpacity(Math.max(0.4, Math.min(1, remaining)))
    }
    updateOpacity()
    const interval = setInterval(updateOpacity, 10000)
    return () => clearInterval(interval)
  }, [message.created_at, message.expires_at])

  return (
    <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')} style={{ transition: 'opacity 0.3s ease' }}>
      <div className={cn('max-w-[80%] rounded-2xl px-4 py-2 relative', isOwn ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white' : 'bg-muted')} style={{ opacity }}>
        <p className="text-sm break-words">{message.content}</p>
        <p className={cn('text-xs mt-1', isOwn ? 'text-white/70' : 'text-muted-foreground')}>{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        {canDelete && !isOwn && (
          <button onClick={() => onDelete(message.id)} className="absolute top-1 right-1 p-1 hover:bg-black/10 rounded">
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify file was created**

```bash
ls -la /data/data/com.termux/files/home/test/daychat/src/components/chat/
```

Expected: message-bubble.tsx exists

- [ ] **Step 4: Commit**

```bash
cd /data/data/com.termux/files/home/test/daychat && git add src/components/chat/message-bubble.tsx && git commit -m "feat: add MessageBubble component"
```

---

### Task 5.2: Create Message Input Component

**Files:**
- Create: `src/components/chat/message-input.tsx`

- [ ] **Step 1: Create message-input.tsx**

```typescript
'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Send } from 'lucide-react'

interface MessageInputProps {
  onSend: (content: string) => void
}

export function MessageInput({ onSend }: MessageInputProps) {
  const [content, setContent] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    onSend(content.trim())
    setContent('')
  }

  return (
    <form onSubmit={handleSubmit} className="border-t p-4 bg-background">
      <div className="flex gap-2">
        <Input value={content} onChange={(e) => setContent(e.target.value)} placeholder="Type a message..." maxLength={500} className="flex-1" />
        <Button type="submit" size="icon" disabled={!content.trim()}>
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Verify file was created**

```bash
ls -la /data/data/com.termux/files/home/test/daychat/src/components/chat/
```

Expected: message-bubble.tsx and message-input.tsx exist

- [ ] **Step 3: Commit**

```bash
cd /data/data/com.termux/files/home/test/daychat && git add src/components/chat/message-input.tsx && git commit -m "feat: add MessageInput component"
```

---

### Task 5.3: Create Chat Interface Component

**Files:**
- Create: `src/components/chat/chat-interface.tsx`

- [ ] **Step 1: Create chat-interface.tsx**

```typescript
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
```

- [ ] **Step 2: Verify file was created**

```bash
ls -la /data/data/com.termux/files/home/test/daychat/src/components/chat/
```

Expected: message-bubble.tsx, message-input.tsx, chat-interface.tsx exist

- [ ] **Step 3: Commit**

```bash
cd /data/data/com.termux/files/home/test/daychat && git add src/components/chat/chat-interface.tsx && git commit -m "feat: add ChatInterface component with real-time messaging"
```

---

### Task 5.4: Create Room Page

**Files:**
- Create: `src/app/room/[id]/page.tsx`

- [ ] **Step 1: Create room page directory**

```bash
mkdir -p /data/data/com.termux/files/home/test/daychat/src/app/room/\[id\]
```

- [ ] **Step 2: Create page.tsx**

```typescript
import { ChatInterface } from '@/components/chat/chat-interface'

export default function RoomPage() {
  return <ChatInterface />
}
```

- [ ] **Step 3: Verify file was created**

```bash
ls -la /data/data/com.termux/files/home/test/daychat/src/app/room/\[id\]/
```

Expected: page.tsx exists

- [ ] **Step 4: Final commit**

```bash
cd /data/data/com.termux/files/home/test/daychat && git add . && git commit -m "feat: add real-time chat interface"
```

---

## Self-Review Checklist

1. **Spec coverage:** All 4 tasks from the spec are covered (MessageBubble, MessageInput, ChatInterface, Room Page)
2. **Placeholder scan:** No TBD/TODO placeholders - all code is complete
3. **Type consistency:** Message interface is consistent across components, file paths are correct
4. **Dependencies verified:** ShareModal exists at `@/components/room/share-modal`, Input/Button from `@/components/ui`, useSupabase from providers
