'use client'

import { IdentitySetup } from '@/components/setup/identity-setup'

export default function SetupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-violet-600/10 to-indigo-600/10">
      <IdentitySetup />
    </div>
  )
}
