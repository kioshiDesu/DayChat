import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { displayName, subscription } = body

    console.log('[Push Subscribe] Received subscription for:', displayName)
    console.log('[Push Subscribe] Subscription endpoint:', subscription?.endpoint?.substring(0, 80))

    if (!displayName || !subscription) {
      return NextResponse.json({ error: 'Missing displayName or subscription' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if this subscription already exists
    const { data: existing } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('display_name', displayName)
      .eq('subscription', JSON.stringify(subscription))
      .single()

    if (existing) {
      console.log('[Push Subscribe] Subscription already exists')
      return NextResponse.json({ message: 'Already subscribed', id: existing.id })
    }

    // Insert new subscription
    const { data, error } = await supabase
      .from('push_subscriptions')
      .insert({
        display_name: displayName,
        subscription: JSON.stringify(subscription),
      })
      .select('id')
      .single()

    if (error) {
      console.error('[Push Subscribe] Insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('[Push Subscribe] Saved successfully, ID:', data?.id)
    return NextResponse.json({ message: 'Subscribed', id: data?.id })
  } catch (error) {
    console.error('[Push Subscribe] Error:', error)
    return NextResponse.json(
      { error: 'Failed to save subscription' },
      { status: 500 }
    )
  }
}
