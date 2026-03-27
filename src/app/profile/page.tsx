'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useIdentity } from '@/components/providers/identity-provider'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RefreshCw, LogOut } from 'lucide-react'
import { generateAnonymousId } from '@/lib/identity-generator'

export default function ProfilePage() {
  const { identity, setIdentity, regenerateIdentity } = useIdentity()
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (identity) {
      setDisplayName(identity.displayName || '')
    }
  }, [identity])

  const handleSave = async () => {
    if (!identity) return
    setLoading(true)
    await setIdentity({
      ...identity,
      displayName: displayName.trim() || null,
    })
    setLoading(false)
  }

  const handleRegenerate = async () => {
    const newId = generateAnonymousId()
    if (identity) {
      await setIdentity({
        ...identity,
        anonId: newId,
      })
    }
  }

  const handleSignOut = () => {
    // Clear identity and redirect to setup
    localStorage.clear()
    const db = require('@/lib/db/daychat-db').db
    db.delete().then(() => {
      window.location.href = '/setup'
    })
  }

  if (!identity) {
    return null
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Profile</h1>
          <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign out" className="h-10 w-10">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
      <div className="p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Your Identity</CardTitle>
            <CardDescription>Your anonymous identity is stored locally in this browser</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="anonId">Anonymous ID</Label>
              <div className="flex gap-2">
                <Input id="anonId" value={identity.anonId} readOnly className="flex-1" />
                <Button variant="outline" size="icon" onClick={handleRegenerate} title="Regenerate ID">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">This is how others see you in chats</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name (optional)</Label>
              <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Leave empty to use Anonymous ID" />
            </div>
            <Button onClick={handleSave} disabled={loading} className="w-full">
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Data Storage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Your identity is stored in this browser's IndexedDB</p>
            <p>• Expired messages are kept locally for your reference</p>
            <p>• Clearing browser data will remove your identity</p>
          </CardContent>
        </Card>
      </div>
      <BottomNav />
    </div>
  )
}
