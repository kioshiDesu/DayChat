'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useIdentity } from '@/components/providers/identity-provider'
import { Loader2 } from 'lucide-react'

const PUBLIC_PATHS = ['/setup']

export function IdentityGuard({ children }: { children: React.ReactNode }) {
  const { identity, loading } = useIdentity()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (loading) return
    if (!identity && !PUBLIC_PATHS.includes(pathname)) {
      router.push('/setup')
    }
  }, [identity, loading, pathname, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  if (!identity && !PUBLIC_PATHS.includes(pathname)) return null
  return <>{children}</>
}
