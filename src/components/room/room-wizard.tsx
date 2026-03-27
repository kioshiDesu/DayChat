'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { createClient } from '@/lib/supabase/client'
import { useIdentity } from '@/components/providers/identity-provider'
import { X } from 'lucide-react'

type WizardStep = 'name' | 'visibility' | 'duration'

export function RoomWizard() {
  const [step, setStep] = useState<WizardStep>('name')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [durationHours, setDurationHours] = useState(24)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const { identity } = useIdentity()
  const supabase = createClient()

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

    const { data, error } = await supabase.from('rooms').insert({
      creator_anon_id: identity.anonId,
      title,
      description: description || null,
      is_public: isPublic,
      invite_code: generateInviteCode(),
      expires_at: expiresAt.toISOString(),
    } as any).select().single()

    if (error) { setError(error.message); setLoading(false); return }

    if (isPublic) { router.push(`/room/${(data as any).id}`) }
    else { router.push(`/room/${(data as any).id}?share=true`) }
  }

  const handleClose = () => {
    router.push('/home')
  }

  const generateInviteCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length))
    return code
  }

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Create Room</CardTitle>
            <CardDescription>Step {step === 'name' ? '1' : step === 'visibility' ? '2' : '3'} of 3</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <Progress value={getProgress()} className="h-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 'name' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="title">Room Title *</Label>
              <Input id="title" placeholder="Block Party 2024" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={50} />
              <p className="text-xs text-muted-foreground">{title.length}/50 characters</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input id="description" placeholder="Annual neighborhood gathering" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} />
              <p className="text-xs text-muted-foreground">{description.length}/200 characters</p>
            </div>
            <Button className="w-full" disabled={!title.trim()} onClick={() => setStep('visibility')}>Next</Button>
          </>
        )}

        {step === 'visibility' && (
          <>
            <div className="space-y-2">
              <Label>Room Visibility</Label>
              <Tabs value={isPublic ? 'public' : 'private'} onValueChange={(v) => setIsPublic(v === 'public')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="public">Public</TabsTrigger>
                  <TabsTrigger value="private">Private</TabsTrigger>
                </TabsList>
                <TabsContent value="public" className="mt-4"><p className="text-sm text-muted-foreground">Anyone can find and join this room from the Discover tab.</p></TabsContent>
                <TabsContent value="private" className="mt-4"><p className="text-sm text-muted-foreground">Only people with the invite link or QR code can join.</p></TabsContent>
              </Tabs>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('name')}>Back</Button>
              <Button className="flex-1" onClick={() => setStep('duration')}>Next</Button>
            </div>
          </>
        )}

        {step === 'duration' && (
          <>
            <div className="space-y-2">
              <Label>Room Duration</Label>
              <div className="flex items-center gap-4">
                <input type="range" min="1" max="24" value={durationHours} onChange={(e) => setDurationHours(Number(e.target.value))} className="w-full" />
                <span className="text-lg font-semibold w-16 text-right">{durationHours}h</span>
              </div>
              <p className="text-sm text-muted-foreground">Room will expire at {new Date(Date.now() + durationHours * 60 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('visibility')}>Back</Button>
              <Button className="flex-1" onClick={handleCreate} disabled={loading}>{loading ? 'Creating...' : 'Create Room'}</Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
