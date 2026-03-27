'use client'

import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { Globe, Terminal } from 'lucide-react'

export function OAuthButtons() {
  const supabase = createClient()

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="space-y-2">
      <Button variant="outline" className="w-full" onClick={() => handleOAuthSignIn('google')}>
        <Globe className="mr-2 h-4 w-4" /> Continue with Google
      </Button>
      <Button variant="outline" className="w-full" onClick={() => handleOAuthSignIn('github')}>
        <Terminal className="mr-2 h-4 w-4" /> Continue with GitHub
      </Button>
    </div>
  )
}
