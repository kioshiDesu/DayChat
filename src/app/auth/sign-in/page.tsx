import { SignInForm } from '@/components/auth/sign-in-form'
import { OAuthButtons } from '@/components/auth/oauth-buttons'
import { Separator } from '@/components/ui/separator'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">DayChat</h1>
          <p className="text-muted-foreground">Ephemeral community rooms</p>
        </div>
        <SignInForm />
        <div className="relative">
          <div className="absolute inset-0 flex items-center"><Separator className="w-full" /></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or continue with</span></div>
        </div>
        <OAuthButtons />
      </div>
    </div>
  )
}
