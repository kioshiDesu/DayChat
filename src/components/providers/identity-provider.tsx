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
        // Verify token matches this browser
        const storedToken = localStorage.getItem('daychat_token')
        
        if (storedToken && storedToken === stored.token) {
          // Token matches - this is the same browser
          console.log('Token verified for:', stored.displayName)
          setIdentityState(stored)
        } else if (!storedToken) {
          // No token in localStorage - first time on this browser
          // But we have identity in DB - use it and save token
          console.log('No token found, saving new token for:', stored.displayName)
          localStorage.setItem('daychat_token', stored.token)
          localStorage.setItem('daychat_display_name', stored.displayName)
          setIdentityState(stored)
        } else {
          // Token mismatch - different browser or cleared storage
          // Keep the display name but generate new token
          console.log('Token mismatch - different browser')
          const { generateToken } = await import('@/lib/identity-generator')
          const newToken = generateToken()
          
          await db.identity.put({ ...stored, token: newToken })
          localStorage.setItem('daychat_token', newToken)
          localStorage.setItem('daychat_display_name', stored.displayName)
          
          setIdentityState({ ...stored, token: newToken })
        }
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
