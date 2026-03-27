'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Check } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

interface ShareModalProps {
  roomId: string
  inviteCode: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ShareModal({ roomId, inviteCode, open, onOpenChange }: ShareModalProps) {
  const [copied, setCopied] = useState(false)
  const inviteLink = typeof window !== 'undefined' ? `${window.location.origin}/room/join/${inviteCode}` : ''

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Private Room</DialogTitle>
          <DialogDescription>Share this link or QR code to invite others</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input value={inviteLink} readOnly className="flex-1" />
            <Button onClick={handleCopy} size="icon">{copied ? <Check className="h-4 w-4" /> : null}</Button>
          </div>
          <div className="flex justify-center py-4">
            <div className="bg-white p-4 rounded-lg"><QRCodeSVG value={inviteLink} size={180} /></div>
          </div>
          <p className="text-xs text-center text-muted-foreground">Scan QR code or click link to join</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
