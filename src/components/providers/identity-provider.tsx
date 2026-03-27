'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { db, Identity } from '@/lib/db/daychat-db'
import { generateUniqueIdentity } from '@/lib/identity-generator'

type IdentityContext = {
  identity: Identity | null
  loading: boolean
  setIdentity: (identity: Identity) => Promise<void>
  regenerateIdentity: () => Promise<string>
}

const Context = createContext<IdentityContext | undefined>(undefined)

export function IdentityProvider({ children }: { children: ReactNode }) {
  const [identity, setIdentityState] = useState<Identity | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadIdentity()
  }, [])

  const loadIdentity = async () => {
    try {
      const stored = await db.identity.get('current')
      if (stored) setIdentityState(stored)
    } catch (error) {
      console.error('Failed to load identity:', error)
    }
    setLoading(false)
  }

  const setIdentity = async (newIdentity: Identity) => {
    await db.identity.put({ ...newIdentity, id: 'current' }, 'current')
    setIdentityState(newIdentity)
  }

  const regenerateIdentity = async (): Promise<string> => {
    const newId = await generateUniqueIdentity()
    if (identity) {
      const updated = { ...identity, anonId: newId }
      await setIdentity(updated)
      return newId
    }
    return newId
  }

  return (
    <Context.Provider value={{ identity, loading, setIdentity, regenerateIdentity }}>
      {children}
    </Context.Provider>
  )
}

export function useIdentity() {
  const context = useContext(Context)
  if (context === undefined) throw new Error('useIdentity must be used inside IdentityProvider')
  return context
}
