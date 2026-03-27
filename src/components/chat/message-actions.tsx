'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { MessageSquare, Pin, Pencil, Trash2, X } from 'lucide-react'

interface MessageActionsProps {
  message: any
  isOwn: boolean
  isCreator: boolean
  isOpen: boolean
  onClose: () => void
  onReply: () => void
  onEdit: () => void
  onDelete: () => void
  onPin: () => void
  isPinned?: boolean
}

export function MessageActions({
  message,
  isOwn,
  isCreator,
  isOpen,
  onClose,
  onReply,
  onEdit,
  onDelete,
  onPin,
  isPinned = false,
}: MessageActionsProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  if (!mounted || !isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50" onClick={onClose}>
      <div
        ref={menuRef}
        className="bg-background rounded-lg shadow-lg overflow-hidden w-[280px] animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-3 border-b">
          <span className="text-sm font-semibold">Message Options</span>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="py-2">
          <button
            onClick={() => { onReply(); onClose() }}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left"
          >
            <MessageSquare className="h-5 w-5" />
            <span>Reply</span>
          </button>

          {(isCreator || isPinned) && (
            <button
              onClick={() => { onPin(); onClose() }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left",
                isPinned && "text-primary"
              )}
            >
              <Pin className={cn("h-5 w-5", isPinned && "fill-current")} />
              <span>{isPinned ? 'Unpin' : 'Pin message'}</span>
            </button>
          )}

          {isOwn && (
            <button
              onClick={() => { onEdit(); onClose() }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left"
            >
              <Pencil className="h-5 w-5" />
              <span>Edit</span>
            </button>
          )}

          {(isOwn || isCreator) && (
            <button
              onClick={() => { onDelete(); onClose() }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-destructive/10 text-destructive transition-colors text-left"
            >
              <Trash2 className="h-5 w-5" />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
