import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { SupabaseProvider } from '@/components/providers/supabase-provider'
import { IdentityProvider } from '@/components/providers/identity-provider'
import { IdentityGuard } from '@/components/guards/identity-guard'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'DayChat - Ephemeral Community Rooms',
  description: 'Create temporary chat rooms that last 24 hours',
  manifest: '/manifest.json',
}

// Register service worker globally on mount
function ServiceWorkerRegistration() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Service Worker registered:', reg.scope))
      .catch(err => console.error('Service Worker registration failed:', err))
  }
  return null
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen flex flex-col">
        <SupabaseProvider>
          <IdentityProvider>
            <IdentityGuard>
              <ServiceWorkerRegistration />
              {children}
            </IdentityGuard>
          </IdentityProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
