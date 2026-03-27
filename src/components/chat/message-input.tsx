'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Send, X } from 'lucide-react'

interface MessageInputProps {
  onSend: (content: string) => void
  replyingTo?: string | null
  onCancelReply?: () => void
}

export function MessageInput({ onSend, replyingTo, onCancelReply }: MessageInputProps) {
  const [content, setContent] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    onSend(content.trim())
    setContent('')
  }

  return (
    <form onSubmit={handleSubmit} className="border-t p-4 bg-background">
      {replyingTo && (
        <div className="mb-2 flex items-center gap-2 text-sm">
          <div className="flex-1 text-muted-foreground">
            Replying to <span className="font-medium text-foreground">{replyingTo}</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancelReply}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={replyingTo ? "Type your reply..." : "Type a message..."}
          maxLength={500}
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={!content.trim()}>
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </form>
  )
}
