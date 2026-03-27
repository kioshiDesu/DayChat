'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Database } from '@/types/database'

export default function JoinRoomPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => { joinRoom() }, [])

  const joinRoom = async () => {
    const code = params.code as string
    const { data: room, error: fetchError } = await supabase.from('rooms').select('*').eq('invite_code', code).single()

    if (fetchError || !room) { setError('Invalid or expired room code'); setLoading(false); return }
    if (new Date((room as Database['public']['Tables']['rooms']['Row']).expires_at) < new Date()) { setError('This room has expired'); setLoading(false); return }

    router.push(`/room/${(room as Database['public']['Tables']['rooms']['Row']).id}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader><CardTitle>Joining Room...</CardTitle></CardHeader>
        <CardContent>
          {loading && <p className="text-muted-foreground">Validating invite code...</p>}
          {error && <div className="space-y-4"><p className="text-red-500">{error}</p><Button onClick={() => router.push('/home')}>Go Home</Button></div>}
        </CardContent>
      </Card>
    </div>
  )
}
