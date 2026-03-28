'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useIdentity } from '@/components/providers/identity-provider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RoomCard } from '@/components/room/room-card'
import { BottomNav } from '@/components/layout/bottom-nav'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Database } from '@/types/database'

export default function HomePage() {
  const { identity } = useIdentity()
  const [myRooms, setMyRooms] = useState<Database['public']['Tables']['rooms']['Row'][]>([])
  const [discoverRooms, setDiscoverRooms] = useState<Database['public']['Tables']['rooms']['Row'][]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (identity) loadRooms()
  }, [identity])

  const loadRooms = async () => {
    setLoading(true)
    if (!identity) { setLoading(false); return }

    // Load rooms created by this identity
    const { data: myRoomsData } = await supabase
      .from('rooms')
      .select('*')
      .eq('creator_anon_id', identity.displayName)
      .order('created_at', { ascending: false })

    // Load rooms where user has sent messages
    const { data: joinedRoomsData } = await supabase
      .from('messages')
      .select('room_id')
      .eq('user_anon_id', identity.displayName)
    
    let joinedRooms: Database['public']['Tables']['rooms']['Row'][] = []
    if (joinedRoomsData) {
      const roomIds = [...new Set(joinedRoomsData.map((m: { room_id: string }) => m.room_id))]
      if (roomIds.length > 0) {
        const { data: joinedRoomsDetails } = await supabase
          .from('rooms')
          .select('*')
          .in('id', roomIds)
        joinedRooms = joinedRoomsDetails || []
      }
    }

    setMyRooms([...(myRoomsData || []), ...joinedRooms].reduce((acc, room) => {
      if (!acc.find((r: { id: string }) => r.id === room.id)) acc.push(room)
      return acc
    }, [] as Database['public']['Tables']['rooms']['Row'][]))

    // Load public rooms for discover
    const { data: publicRooms } = await supabase
      .from('rooms')
      .select('*')
      .eq('is_public', true)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(50)
    
    setDiscoverRooms(publicRooms || [])
    setLoading(false)
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="sticky top-0 bg-background z-10 border-b">
        <div className="p-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">DayChat</h1>
          {identity && (
            <p className="text-xs text-muted-foreground">
              Logged in as {identity.displayName}
            </p>
          )}
        </div>
        <Tabs defaultValue="my-rooms" className="w-full">
          <div className="px-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="my-rooms">My Rooms</TabsTrigger>
              <TabsTrigger value="discover">Discover</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="my-rooms" className="p-4">
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-3">
                {myRooms.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No rooms yet. Create one or join a private room!
                  </p>
                ) : (
                  myRooms.map((room) => <RoomCard key={room.id} {...room} />)
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="discover" className="p-4">
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-3">
                {discoverRooms.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No public rooms available
                  </p>
                ) : (
                  discoverRooms.map((room) => <RoomCard key={room.id} {...room} />)
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
      <BottomNav />
    </div>
  )
}
