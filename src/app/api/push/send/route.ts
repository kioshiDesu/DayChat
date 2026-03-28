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
    const { displayName, title, body, url, roomId } = await request.json()

    if (!displayName) {
      return NextResponse.json({ error: 'Display name required' }, { status: 400 })
    }

    // Get Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get user's push subscriptions
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('display_name', displayName)

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ message: 'No subscriptions found' })
    }

    // Send push to all subscriptions
    const pushPromises = subscriptions.map(async (sub: any) => {
      try {
        await webPush.sendNotification(
          sub.subscription,
          JSON.stringify({
            title,
            body,
            url,
            roomId,
          })
        )
      } catch (error) {
        console.error('Push send failed:', error)
        // Remove invalid subscription
        if ((error as any).statusCode === 410) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('subscription', sub.subscription)
        }
      }
    })

    await Promise.all(pushPromises)

    return NextResponse.json({ message: 'Push sent successfully' })
  } catch (error) {
    console.error('Push API error:', error)
    return NextResponse.json(
      { error: 'Failed to send push notification' },
      { status: 500 }
    )
  }
}
