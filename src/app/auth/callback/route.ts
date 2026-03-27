import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Handle OAuth errors
  if (error) {
    console.error('Auth error:', error, errorDescription)
    return NextResponse.redirect(new URL('/auth/sign-in?error=' + encodeURIComponent(errorDescription || error), request.url))
  }

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('Session exchange error:', exchangeError)
      return NextResponse.redirect(new URL('/auth/sign-in?error=' + encodeURIComponent(exchangeError.message), request.url))
    }

    // Get the user to verify session is valid
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.error('No user after session exchange')
      return NextResponse.redirect(new URL('/auth/sign-in?error=No user found', request.url))
    }

    // Redirect to home - session is now set in cookies
    return NextResponse.redirect(new URL('/home', request.url))
  }

  // No code, redirect to sign in
  return NextResponse.redirect(new URL('/auth/sign-in', request.url))
}
