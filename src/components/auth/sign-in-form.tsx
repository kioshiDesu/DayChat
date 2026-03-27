'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createClient } from '@/lib/supabase/client'
import { useSupabase } from '@/components/providers/supabase-provider'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export function SignInForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, supabase } = useSupabase()

  // Check for auth errors from callback
  useEffect(() => {
    const error = searchParams?.get('error')
    if (error) {
      setMessage({ type: 'error', text: decodeURIComponent(error) })
    }
  }, [searchParams])

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/home')
    } else {
      setCheckingSession(false)
    }
  }, [user, router])

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setMessage({ type: 'success', text: 'Signed in successfully!' })
        router.push('/home')
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth, router])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const { error } = await supabase.auth.signInWithOtp({ 
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      }
    })

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Check your email for the magic link!' })
    }
    setLoading(false)
  }

  if (checkingSession) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSignIn} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <Input 
          id="email" 
          type="email" 
          placeholder="you@example.com" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
          disabled={loading}
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading || !!message?.type === 'success'}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          'Send Magic Link'
        )}
      </Button>
      
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className={message.type === 'success' ? 'bg-green-50 border-green-200' : ''}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className="ml-2">{message.text}</AlertDescription>
        </Alert>
      )}
      
      <p className="text-xs text-center text-muted-foreground">
        No account needed. We'll send you a magic link.
      </p>
    </form>
  )
}
