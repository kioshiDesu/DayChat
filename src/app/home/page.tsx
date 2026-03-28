'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useIdentity } from '@/components/providers/identity-provider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RoomList } from '@/components/room/room-list'
import { BottomNav } from '@/components/layout/bottom-nav'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2 } from 'lucide-react'

interface Room {
  id: string
  title: string
  description: string | null
  is_public: boolean
  invite_code: string
  expires_at: string
  created_at: string
  creator_anon_id: string
}

export default function HomePage() {
  const { identity } = useIdentity()
  const [myRooms, setMyRooms] = useState<Room[]>([])
  const [discoverRooms, setDiscoverRooms] = useState<Room[]>([])
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

    let joinedRooms: Room[] = []
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
    }, [] as Room[]))

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
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="p-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">DayChat</h1>
          {identity && (
            <p className="text-xs text-muted-foreground">
              Logged in as {identity.displayName}
            </p>
          )}
        </div>
      </div>

      <Tabs defaultValue="my-rooms" className="w-full">
        <div className="sticky top-[73px] z-30 bg-background border-b">
          <div className="px-4 py-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="my-rooms">My Rooms</TabsTrigger>
              <TabsTrigger value="discover">Discover</TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="my-rooms" className="mt-0">
          <ScrollArea className="h-[calc(100vh-180px)]">
            <div className="p-4 space-y-2">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : myRooms.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No rooms yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Create one or join a private room!</p>
                </div>
              ) : (
                <RoomList rooms={myRooms} />
              )}
            </div>
          </ScrollArea>
        </TabsContent>
        <TabsContent value="discover" className="mt-0">
          <ScrollArea className="h-[calc(100vh-180px)]">
            <div className="p-4 space-y-2">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : discoverRooms.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No public rooms available</p>
                </div>
              ) : (
                <RoomList rooms={discoverRooms} />
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <BottomNav />
    </div>
  )
}
