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
      console.log('Loading identity from IndexedDB...')
      const stored = await db.identity.get('current')
      console.log('Identity loaded:', stored ? 'FOUND' : 'NOT FOUND')
      
      if (stored) {
        // Verify token matches localStorage
        const storedToken = localStorage.getItem('daychat_token')
        if (stored.token && storedToken !== stored.token) {
          console.log('Token mismatch! Clearing identity.')
          await db.identity.clear()
          localStorage.removeItem('daychat_token')
          localStorage.removeItem('daychat_anon_id')
          setIdentityState(null)
        } else {
          console.log('Identity:', stored)
          setIdentityState(stored)
        }
      }
    } catch (error) {
      console.error('Failed to load identity:', error)
    }
    setLoading(false)
  }

  const setIdentity = async (newIdentity: Identity) => {
    console.log('Setting identity:', newIdentity)
    await db.identity.put({ ...newIdentity, id: 'current' }, 'current')
    console.log('Identity saved to IndexedDB')
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
