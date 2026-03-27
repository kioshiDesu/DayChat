'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useIdentity } from '@/components/providers/identity-provider'
import { Loader2, RefreshCw } from 'lucide-react'

export function IdentitySetup() {
  const [generatedId, setGeneratedId] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { regenerateIdentity, setIdentity } = useIdentity()
  const router = useRouter()

  useEffect(() => {
    generateNewIdentity()
  }, [])

  const generateNewIdentity = async () => {
    const newId = await regenerateIdentity()
    setGeneratedId(newId)
    setLoading(false)
  }

  const handleContinue = async () => {
    setSaving(true)
    await setIdentity({
      id: 'current',
      anonId: generatedId,
      displayName: displayName.trim() || null,
      createdAt: new Date(),
    })
    router.push('/home')
  }

  if (loading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome to DayChat!</CardTitle>
        <CardDescription>Let's create your anonymous identity</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Your Anonymous ID</Label>
          <div className="flex gap-2">
            <div className="flex-1 p-3 bg-muted rounded-lg text-center font-mono">
              {generatedId}
            </div>
            <Button variant="outline" size="icon" onClick={generateNewIdentity}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Regenerate until you like it!</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="displayName">Display Name (optional)</Label>
          <Input id="displayName" placeholder="What should we call you?" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={30} />
          <p className="text-xs text-muted-foreground">Leave empty to use your anonymous ID</p>
        </div>
        <Button className="w-full" onClick={handleContinue} disabled={saving}>
          {saving ? 'Saving...' : 'Continue to DayChat'}
        </Button>
      </CardContent>
    </Card>
  )
}
