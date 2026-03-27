import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  try {
    await supabase.rpc('cleanup_expired_data')
    return NextResponse.json({ success: true, message: 'Cleanup completed' })
  } catch (error) {
    console.error('Cleanup failed:', error)
    return NextResponse.json({ success: false, error: 'Cleanup failed' }, { status: 500 })
  }
}
