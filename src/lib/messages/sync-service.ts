import { createClient } from '@/lib/supabase/client'
import { db, LocalMessage, Identity as DbIdentity } from '@/lib/db/daychat-db'

export interface Identity {
  id?: string
  anonId: string
  displayName: string | null
  createdAt: Date
}

const supabase = createClient()

export async function sendMessage(roomId: string, content: string, identity: Identity) {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const tempId = crypto.randomUUID()

  const localMessage: LocalMessage = {
    id: tempId,
    room_id: roomId,
    user_anon_id: identity.anonId,
    display_name: identity.displayName || identity.anonId,
    content,
    expires_at: expiresAt.toISOString(),
    created_at: new Date().toISOString(),
    expired: false,
    synced: false,
  }

  await db.messages.add(localMessage)

  const { data, error } = await supabase
    .from('messages')
    .insert({
      room_id: roomId,
      user_anon_id: identity.anonId,
      display_name: identity.displayName || identity.anonId,
      content,
      expires_at: expiresAt.toISOString(),
    } as any)
    .select('*')
    .single() as { data: { id: string } | null; error: any }

  if (error || !data) {
    await db.messages.update(tempId, { synced: false })
    if (error) throw error
    throw new Error('No data returned')
  }

  await db.messages.update(tempId, { id: data.id, synced: true })
  return data
}

export async function loadMessages(roomId: string): Promise<LocalMessage[]> {
  const localMessages = await db.messages.where('room_id').equals(roomId).toArray()
  const { data: serverMessages } = await supabase
    .from('messages')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true }) as { data: LocalMessage[] | null }

  if (!serverMessages) return localMessages

  const serverIds = new Set(serverMessages.map(m => m.id))

  for (const msg of localMessages) {
    if (!serverIds.has(msg.id) && !msg.expired) {
      await db.messages.update(msg.id, { expired: true })
    }
  }

  for (const msg of serverMessages) {
    const existing = await db.messages.get(msg.id)
    if (!existing) {
      await db.messages.add({ ...msg, expired: false, synced: true })
    }
  }

  return db.messages.where('room_id').equals(roomId).toArray()
}

export function subscribeToMessages(roomId: string, onMessage: (msg: LocalMessage, type: 'new' | 'expired') => void) {
  console.log('Subscribing to messages for room:', roomId)
  const channel = supabase
    .channel(`room:${roomId}`)
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
      async (payload) => {
        console.log('Received INSERT event:', payload.new)
        const newMsg = payload.new as LocalMessage
        await db.messages.put({ ...newMsg, expired: false, synced: true })
        onMessage(newMsg, 'new')
      }
    )
    .on('postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'messages' },
      async (payload) => {
        console.log('Received DELETE event:', payload.old)
        await db.messages.update(payload.old.id, { expired: true })
        onMessage({ ...payload.old, expired: true } as LocalMessage, 'expired')
      }
    )
    .subscribe((status) => {
      console.log('Subscription status:', status)
      if (status === 'SUBSCRIBED') {
        console.log('Successfully subscribed to room:', roomId)
      } else if (status === 'CHANNEL_ERROR') {
        console.error('Subscription error for room:', roomId)
      }
    })

  return () => { 
    console.log('Unsubscribing from room:', roomId)
    supabase.removeChannel(channel) 
  }
}
