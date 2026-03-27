'use client'

import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const SignInForm = dynamic(() => import('@/components/auth/sign-in-form').then(mod => ({ default: mod.SignInForm })), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-8">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
    </div>
  )
})

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-violet-600/10 to-indigo-600/10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">DayChat</h1>
            <CardDescription>Ephemeral community rooms</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <SignInForm />
        </CardContent>
      </Card>
    </div>
  )
}
