'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Clock, Pencil, Trash2 } from 'lucide-react'
import { ExpiryCountdown } from './expiry-countdown'

interface RoomSettingsProps {
  room: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdateTitle: (title: string) => void
  onDeleteRoom: () => void
  isCreator: boolean
}

export function RoomSettings({
  room,
  open,
  onOpenChange,
  onUpdateTitle,
  onDeleteRoom,
  isCreator,
}: RoomSettingsProps) {
  const [editMode, setEditMode] = useState(false)
  const [newTitle, setNewTitle] = useState(room?.title || '')
  const [isDeleting, setIsDeleting] = useState(false)

  const handleSaveTitle = () => {
    if (newTitle.trim()) {
      onUpdateTitle(newTitle.trim())
      setEditMode(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    await onDeleteRoom()
    setIsDeleting(false)
  }

  if (!room) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Room Settings</DialogTitle>
          <DialogDescription>
            Manage room settings and expiration
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Room Title */}
          <div className="space-y-2">
            <Label>Room Title</Label>
            {editMode ? (
              <div className="flex gap-2">
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Enter new title"
                  maxLength={50}
                />
                <Button size="sm" onClick={handleSaveTitle}>Save</Button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="font-medium">{room.title}</span>
                {isCreator && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditMode(true)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Expiration */}
          <div className="space-y-2">
            <Label>Expiration</Label>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <ExpiryCountdown expiresAt={room.expires_at} />
            </div>
            <p className="text-xs text-muted-foreground">
              Room will automatically delete after expiration
            </p>
          </div>

          {/* Room Info */}
          <div className="space-y-2">
            <Label>Room ID</Label>
            <div className="p-3 bg-muted rounded-lg font-mono text-xs break-all">
              {room.id}
            </div>
          </div>

          {/* Delete Room */}
          {isCreator && (
            <div className="pt-4 border-t">
              <Label className="text-destructive">Danger Zone</Label>
              <Button
                variant="destructive"
                className="w-full mt-2"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? 'Deleting...' : 'Delete Room'}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                This will permanently delete the room and all messages
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
