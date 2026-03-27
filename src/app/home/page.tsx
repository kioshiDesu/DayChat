'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSupabase } from '@/components/providers/supabase-provider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RoomCard } from '@/components/room/room-card'
import { BottomNav } from '@/components/layout/bottom-nav'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function HomePage() {
  const { user } = useSupabase()
  const [myRooms, setMyRooms] = useState<any[]>([])
  const [discoverRooms, setDiscoverRooms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => { loadRooms() }, [])

  const loadRooms = async () => {
    setLoading(true)
    if (!user) { setLoading(false); return }

    const { data: myRoomsData } = await supabase.from('rooms').select('*').eq('creator_id', user.id).order('created_at', { ascending: false })

    const { data: joinedRoomsData } = await supabase.from('messages').select('room_id').eq('user_id', user.id)
    let joinedRooms: any[] = []
    if (joinedRoomsData) {
      const roomIds = [...new Set(joinedRoomsData.map(m => m.room_id))]
      const { data: joinedRoomsDetails } = await supabase.from('rooms').select('*').in('id', roomIds)
      joinedRooms = joinedRoomsDetails || []
    }

    setMyRooms([...(myRoomsData || []), ...joinedRooms].reduce((acc, room) => {
      if (!acc.find(r => r.id === room.id)) acc.push(room)
      return acc
    }, [] as any[]))

    const { data: publicRooms } = await supabase.from('rooms').select('*').eq('is_public', true).gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false }).limit(50)
    setDiscoverRooms(publicRooms || [])
    setLoading(false)
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="sticky top-0 bg-background z-10 border-b">
        <div className="p-4"><h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">DayChat</h1></div>
        <Tabs defaultValue="my-rooms" className="w-full">
          <div className="px-4"><TabsList className="grid w-full grid-cols-2"><TabsTrigger value="my-rooms">My Rooms</TabsTrigger><TabsTrigger value="discover">Discover</TabsTrigger></TabsList></div>
          <TabsContent value="my-rooms" className="p-4">
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-3">
                {myRooms.length === 0 ? <p className="text-center text-muted-foreground py-8">No rooms yet. Create one or join a private room!</p> : myRooms.map((room) => <RoomCard key={room.id} {...room} />)}
              </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="discover" className="p-4">
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-3">
                {discoverRooms.length === 0 ? <p className="text-center text-muted-foreground py-8">No public rooms available</p> : discoverRooms.map((room) => <RoomCard key={room.id} {...room} />)}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
      <BottomNav />
    </div>
  )
}
