import { NextRequest, NextResponse } from 'next/server'
import webPush from 'web-push'
import { createClient } from '@supabase/supabase-js'

// Configure VAPID
webPush.setVapidDetails(
  'mailto:your-email@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { displayName, title, body: messageBody, url, roomId } = body

    console.log('[Push API] Received push request:', { displayName, title, body: messageBody, url, roomId })

    if (!displayName) {
      console.log('[Push API] Rejecting: no display name provided')
      return NextResponse.json({ error: 'Display name required' }, { status: 400 })
    }

    // Get Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get user's push subscriptions
    const { data: subscriptions, error: fetchError } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('display_name', displayName)

    if (fetchError) {
      console.error('[Push API] Failed to fetch subscriptions:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 })
    }

    console.log('[Push API] Found subscriptions for', displayName, ':', subscriptions?.length || 0)

    if (!subscriptions || subscriptions.length === 0) {
      console.log('[Push API] No subscriptions found for user:', displayName)
      return NextResponse.json({ message: 'No subscriptions found' })
    }

    // Send push to all subscriptions
    const pushPromises = subscriptions.map(async (sub: any, index: number) => {
      try {
        console.log('[Push API] Sending push to subscription', index + 1, 'of', subscriptions.length)
        await webPush.sendNotification(
          sub.subscription,
          JSON.stringify({
            title,
            body: messageBody,
            url,
            roomId,
          })
        )
        console.log('[Push API] Push sent successfully to subscription', index + 1)
      } catch (error) {
        console.error('[Push API] Push send failed for subscription', index + 1, ':', error)
        // Remove invalid subscription
        if ((error as any).statusCode === 410) {
          console.log('[Push API] Removing expired subscription (410)')
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('subscription', sub.subscription)
        }
      }
    })

    await Promise.all(pushPromises)
    console.log('[Push API] All push notifications processed')

    return NextResponse.json({ message: 'Push sent successfully' })
  } catch (error) {
    console.error('[Push API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to send push notification' },
      { status: 500 }
    )
  }
}
