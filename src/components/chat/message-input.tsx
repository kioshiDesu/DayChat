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
