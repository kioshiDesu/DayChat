'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { SupabaseClient, User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

type SupabaseContext = { supabase: SupabaseClient; user: User | null; loading: boolean }

const Context = createContext<SupabaseContext | undefined>(undefined)

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  return <Context.Provider value={{ supabase, user, loading }}>{children}</Context.Provider>
}

export function useSupabase() {
  const context = useContext(Context)
  if (context === undefined) throw new Error('useSupabase must be used inside SupabaseProvider')
  return context
}
