'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { Globe, Terminal, AlertCircle } from 'lucide-react'

export function OAuthButtons() {
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) setError(error.message)
    } catch (err) {
      setError('OAuth provider not configured. Please use email sign-in.')
    }
  }

  return (
    <div className="space-y-2">
      <Button variant="outline" className="w-full" onClick={() => handleOAuthSignIn('google')} disabled={!!error}>
        <Globe className="mr-2 h-4 w-4" /> Continue with Google
      </Button>
      <Button variant="outline" className="w-full" onClick={() => handleOAuthSignIn('github')} disabled={!!error}>
        <Terminal className="mr-2 h-4 w-4" /> Continue with GitHub
      </Button>
      {error && (
        <div className="flex items-center gap-2 text-xs text-orange-500 bg-orange-50 p-2 rounded">
          <AlertCircle className="h-3 w-3" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
