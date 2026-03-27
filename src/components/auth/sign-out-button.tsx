'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { LogOut } from 'lucide-react'

export function SignOutButton() {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/sign-in')
  }

  return (
    <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign out">
      <LogOut className="h-5 w-5" />
    </Button>
  )
}
