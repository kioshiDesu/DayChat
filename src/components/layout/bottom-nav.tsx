'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Home, PlusCircle, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CreateRoomModal } from '@/components/room/create-room-modal'

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [showCreateModal, setShowCreateModal] = useState(false)

  const handleNavClick = (href: string, action?: () => void) => {
    if (action) {
      action()
    } else {
      router.push(href)
    }
  }

  const navItems = [
    { href: '/home', icon: Home, label: 'Home' },
    { icon: PlusCircle, label: 'Create', action: () => setShowCreateModal(true) },
    { href: '/profile', icon: User, label: 'Profile' },
  ]

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 border-t bg-background z-50 pb-safe">
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto pb-[env(safe-area-inset-bottom)]">
          {navItems.map((item, index) => {
            const isActive = item.href && (pathname === item.href || (item.href !== '/home' && pathname?.startsWith(item.href)))
            return (
              <button
                key={index}
                onClick={() => handleNavClick(item.href || '', item.action)}
                className={cn('flex flex-col items-center justify-center w-full h-full text-muted-foreground hover:text-foreground transition-colors', isActive && 'text-foreground')}
              >
                <item.icon className={cn('h-6 w-6', isActive && 'fill-current')} />
                <span className="text-xs mt-1">{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
      <CreateRoomModal open={showCreateModal} onOpenChange={setShowCreateModal} />
    </>
  )
}
