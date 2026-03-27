'use client'

import { SignInForm } from '@/components/auth/sign-in-form'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

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
