'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { createClient } from '@/lib/supabase/client'
import { useIdentity } from '@/components/providers/identity-provider'
import { Plus } from 'lucide-react'

type WizardStep = 'name' | 'visibility' | 'duration'

interface CreateRoomModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateRoomModal({ open, onOpenChange }: CreateRoomModalProps) {
  const [step, setStep] = useState<WizardStep>('name')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [durationHours, setDurationHours] = useState(24)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const { identity } = useIdentity()

  const getProgress = () => {
    switch (step) {
      case 'name': return 33
      case 'visibility': return 66
      case 'duration': return 100
    }
  }

  const handleCreate = async () => {
    if (!identity) { setError('You must have an identity'); return }

    setLoading(true)
    setError(null)
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + durationHours)

    const supabase = createClient()
    const { data, error } = await supabase.from('rooms').insert({
      creator_anon_id: identity.displayName,
      title,
      description: description || null,
      is_public: isPublic,
      invite_code: generateInviteCode(),
      expires_at: expiresAt.toISOString(),
    } as any).select().single()

    if (error) { setError(error.message); setLoading(false); return }

    onOpenChange(false)
    resetForm()
    
    if (isPublic) { router.push(`/room/${data.id}`) }
    else { router.push(`/room/${data.id}?share=true`) }
  }

  const generateInviteCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length))
    return code
  }

  const resetForm = () => {
    setStep('name')
    setTitle('')
    setDescription('')
    setIsPublic(true)
    setDurationHours(24)
    setLoading(false)
    setError(null)
  }

  const handleClose = () => {
    resetForm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Room</DialogTitle>
          <DialogDescription>Step {step === 'name' ? '1' : step === 'visibility' ? '2' : '3'} of 3</DialogDescription>
        </DialogHeader>

        <Progress value={getProgress()} className="h-2" />

        <div className="py-4">
          {step === 'name' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Room Title *</Label>
                <Input 
                  id="title" 
                  placeholder="Block Party 2024" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  maxLength={50} 
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">{title.length}/50 characters</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Input 
                  id="description" 
                  placeholder="Annual neighborhood gathering" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  maxLength={200} 
                />
                <p className="text-xs text-muted-foreground">{description.length}/200 characters</p>
              </div>
            </div>
          )}

          {step === 'visibility' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Room Visibility</Label>
                <Tabs value={isPublic ? 'public' : 'private'} onValueChange={(v) => setIsPublic(v === 'public')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="public">Public</TabsTrigger>
                    <TabsTrigger value="private">Private</TabsTrigger>
                  </TabsList>
                  <TabsContent value="public" className="mt-3 p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Anyone can find and join this room from the Discover tab.</p>
                  </TabsContent>
                  <TabsContent value="private" className="mt-3 p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Only people with the invite link or QR code can join.</p>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}

          {step === 'duration' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <Label>Room Duration: {durationHours} hours</Label>
                <input 
                  type="range" 
                  min="1" 
                  max="24" 
                  value={durationHours} 
                  onChange={(e) => setDurationHours(Number(e.target.value))} 
                  className="w-full" 
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1h</span>
                  <span>12h</span>
                  <span>24h</span>
                </div>
                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  Room will expire at{' '}
                  <span className="font-medium text-foreground">
                    {new Date(Date.now() + durationHours * 60 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </p>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {step !== 'name' && (
            <Button variant="outline" onClick={() => setStep(step === 'duration' ? 'visibility' : 'name')}>
              Back
            </Button>
          )}
          {step !== 'duration' ? (
            <Button onClick={() => setStep(step === 'name' ? 'visibility' : 'duration')}>
              Next
            </Button>
          ) : (
            <Button onClick={handleCreate} disabled={loading || !title.trim()}>
              {loading ? 'Creating...' : 'Create Room'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
