'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Bell, BellOff, Loader2 } from 'lucide-react'
import { subscribeToPush, unsubscribeFromPush } from '@/lib/push/push-utils'
import { useIdentity } from '@/components/providers/identity-provider'
import { db } from '@/lib/db/daychat-db'

export function PushSettings() {
  const { identity } = useIdentity()
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkSubscription()
  }, [])

  const checkSubscription = async () => {
    try {
      if (!('serviceWorker' in navigator) || !('pushManager' in window)) {
        console.log('Push notifications not supported')
        setIsSubscribed(false)
        return
      }
      
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      setIsSubscribed(!!subscription)
    } catch (error) {
      console.error('Error checking subscription:', error)
      setIsSubscribed(false)
    }
  }

  const handleSubscribe = async () => {
    if (!identity) return
    setLoading(true)

    console.log('[Push] Starting subscription process for:', identity.displayName)
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
    const subscription = await subscribeToPush(vapidPublicKey)

    if (subscription) {
      console.log('[Push] Subscription created successfully')
      // Save to IndexedDB
      await db.identity.put({
        ...identity,
        pushSubscription: subscription.toJSON() as any,
      })
      console.log('[Push] Saved subscription to IndexedDB')

      // Save to Supabase (for server-side sending)
      const supabase = (await import('@/lib/supabase/client')).createClient()
      const { error } = await supabase.from('push_subscriptions' as any).insert({
        display_name: identity.displayName,
        subscription: JSON.stringify(subscription),
      } as any)

      if (error) {
        console.error('[Push] Failed to save subscription to Supabase:', error)
      } else {
        console.log('[Push] Saved subscription to Supabase successfully')
      }

      setIsSubscribed(true)
    } else {
      console.log('[Push] Subscription failed - no subscription returned')
    }

    setLoading(false)
  }

  const handleUnsubscribe = async () => {
    setLoading(true)

    const success = await unsubscribeFromPush()
    if (success) {
      setIsSubscribed(false)
    }

    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Push Notifications</CardTitle>
        <CardDescription>
          Get notified when you receive new messages
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isSubscribed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-green-600" />
              <span>Notifications enabled</span>
            </div>
            <Button
              variant="outline"
              onClick={handleUnsubscribe}
              disabled={loading}
            >
              <BellOff className="h-4 w-4 mr-2" />
              Disable
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BellOff className="h-5 w-5 text-muted-foreground" />
              <span>Notifications disabled</span>
            </div>
            <Button
              onClick={handleSubscribe}
              disabled={loading || !identity}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enabling...
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4 mr-2" />
                  Enable
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
