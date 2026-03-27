'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExpiryCountdownProps {
  expiresAt: string
  className?: string
}

export function ExpiryCountdown({ expiresAt, className }: ExpiryCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState('')
  const [status, setStatus] = useState<'normal' | 'warning' | 'danger'>('normal')

  useEffect(() => {
    const updateRemaining = () => {
      const expires = new Date(expiresAt).getTime()
      const now = Date.now()
      const diff = expires - now

      if (diff <= 0) {
        setTimeRemaining('Expired')
        setStatus('danger')
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      if (hours < 2) setStatus('warning')
      if (minutes < 30) setStatus('danger')

      if (minutes < 5) {
        const seconds = Math.floor((diff % (1000 * 60)) / 1000)
        setTimeRemaining(`${minutes}m ${seconds}s`)
      } else {
        setTimeRemaining(`${hours}h ${minutes}m`)
      }
    }

    updateRemaining()
    const interval = setInterval(updateRemaining, 1000)
    return () => clearInterval(interval)
  }, [expiresAt])

  return (
    <div className={cn('flex items-center gap-2 text-sm', className)}>
      <Clock className={cn('h-4 w-4', {
        'text-muted-foreground': status === 'normal',
        'text-orange-500 animate-pulse': status === 'warning',
        'text-red-500 animate-pulse': status === 'danger',
      })} />
      <span className={cn('font-medium', {
        'text-muted-foreground': status === 'normal',
        'text-orange-500': status === 'warning',
        'text-red-500 font-bold': status === 'danger',
      })}>
        {timeRemaining}
      </span>
      {status === 'danger' && <span className="text-xs text-red-500 ml-1">Expiring soon!</span>}
    </div>
  )
}
