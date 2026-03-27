'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { db, Identity } from '@/lib/db/daychat-db'

type IdentityContext = {
  identity: Identity | null
  loading: boolean
  setIdentity: (identity: Identity) => Promise<void>
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
      console.log('Loading identity from IndexedDB...')
      const stored = await db.identity.get('current')
      console.log('Identity loaded:', stored ? 'FOUND' : 'NOT FOUND')
      
      if (stored) {
        console.log('Identity:', stored.displayName)
        setIdentityState(stored)
      }
    } catch (error) {
      console.error('Failed to load identity:', error)
    }
    setLoading(false)
  }

  const setIdentity = async (newIdentity: Identity) => {
    console.log('Setting identity:', newIdentity)
    await db.identity.put({ ...newIdentity, id: 'current' })
    console.log('Identity saved to IndexedDB')
    setIdentityState(newIdentity)
  }

  return (
    <Context.Provider value={{ identity, loading, setIdentity }}>
      {children}
    </Context.Provider>
  )
}

export function useIdentity() {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error('useIdentity must be used inside IdentityProvider')
  }
  return context
}
