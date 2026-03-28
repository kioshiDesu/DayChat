'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useIdentity } from '@/components/providers/identity-provider'
import { Loader2, RefreshCw } from 'lucide-react'
import { generateDisplayName } from '@/lib/identity-generator'

export function IdentitySetup() {
  const [displayName, setDisplayName] = useState('')
  const [suggestedName, setSuggestedName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { setIdentity } = useIdentity()
  const router = useRouter()

  useEffect(() => {
    setSuggestedName(generateDisplayName())
    setLoading(false)
  }, [])

  const handleUseSuggested = () => {
    setDisplayName(suggestedName)
  }

  const handleContinue = async () => {
    if (!displayName.trim()) return
    
    setSaving(true)
    
    const finalName = displayName.trim()
    
    // Generate unique token for this browser
    const { generateToken } = await import('@/lib/identity-generator')
    const token = generateToken()
    
    // Save identity with display name + token
    const { db } = await import('@/lib/db/daychat-db')
    await db.identity.put({
      id: 'current',
      displayName: finalName,
      token,
      createdAt: new Date(),
    })
    
    // Save to localStorage for quick verification
    localStorage.setItem('daychat_token', token)
    localStorage.setItem('daychat_display_name', finalName)
    
    console.log('Identity saved:', { name: finalName, token })
    
    // Small delay to ensure DB write completes
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Hard redirect to force reload
    window.location.href = '/home'
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
        <CardDescription>Choose your display name</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Display Name</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Enter your name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={30}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={handleUseSuggested}
              title="Use suggested name"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            This is how others will see you. Click ↻ for a random name.
          </p>
        </div>

        <Button 
          className="w-full" 
          onClick={handleContinue} 
          disabled={saving || !displayName.trim()}
        >
          {saving ? 'Saving...' : 'Continue to DayChat'}
        </Button>
      </CardContent>
    </Card>
  )
}
