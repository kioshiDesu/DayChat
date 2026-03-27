'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useIdentity } from '@/components/providers/identity-provider'
import { Loader2 } from 'lucide-react'

const PUBLIC_PATHS = ['/setup']

export function IdentityGuard({ children }: { children: React.ReactNode }) {
  const { identity, loading } = useIdentity()
  const router = useRouter()
  const pathname = usePathname()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (loading) return
    
    console.log('IdentityGuard check:', {
      pathname,
      hasIdentity: !!identity,
      isPublicPath: PUBLIC_PATHS.includes(pathname),
    })
    
    if (!identity && !PUBLIC_PATHS.includes(pathname)) {
      console.log('No identity, redirecting to /setup')
      router.push('/setup')
    }
    setChecked(true)
  }, [identity, loading, pathname, router])

  if (loading || !checked) {
    console.log('IdentityGuard: loading or not checked yet')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  if (!identity && !PUBLIC_PATHS.includes(pathname)) {
    console.log('IdentityGuard: blocking render, no identity')
    return null
  }
  
  console.log('IdentityGuard: rendering children')
  return <>{children}</>
}
