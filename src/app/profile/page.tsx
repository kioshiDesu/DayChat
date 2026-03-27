'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useSupabase } from '@/components/providers/supabase-provider'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SignOutButton } from '@/components/auth/sign-out-button'

export default function ProfilePage() {
  const { user } = useSupabase()
  const router = useRouter()
  const supabase = createClient()
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { if (user) setUsername(user.email?.split('@')[0] || '') }, [user])

  const handleSave = async () => {
    setLoading(true)
    await supabase.auth.updateUser({ data: { username } })
    setLoading(false)
  }

  if (!user) { router.push('/auth/sign-in'); return null }

  return (
    <div className="min-h-screen pb-20">
      <div className="border-b p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Profile</h1>
        <SignOutButton />
      </div>
      <div className="p-4 space-y-4">
        <Card>
          <CardHeader><CardTitle>Account Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user.email || ''} readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <Button onClick={handleSave} disabled={loading} className="w-full">{loading ? 'Saving...' : 'Save Changes'}</Button>
          </CardContent>
        </Card>
      </div>
      <BottomNav />
    </div>
  )
}
