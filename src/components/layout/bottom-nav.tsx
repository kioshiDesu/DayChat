'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, PlusCircle, User } from 'lucide-react'
import { cn } from '@/lib/utils'

export function BottomNav() {
  const pathname = usePathname()
  const navItems = [
    { href: '/home', icon: Home, label: 'Home' },
    { href: '/create', icon: PlusCircle, label: 'Create' },
    { href: '/profile', icon: User, label: 'Profile' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t bg-background z-50 pb-safe">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/home' && pathname?.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href} className={cn('flex flex-col items-center justify-center w-full h-full text-muted-foreground hover:text-foreground transition-colors', isActive && 'text-foreground')}>
              <item.icon className={cn('h-6 w-6', isActive && 'fill-current')} />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
