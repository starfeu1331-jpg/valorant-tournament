import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Routes protégées pour le staff
  if (pathname.startsWith('/staff')) {
    // Vérifier si l'utilisateur a un cookie de session
    const sessionToken = request.cookies.get('next-auth.session-token') || 
                         request.cookies.get('__Secure-next-auth.session-token')
    
    if (!sessionToken) {
      return NextResponse.redirect(new URL('/auth/signin?callbackUrl=/staff', request.url))
    }

    // Pour la stratégie database, on laisse la page vérifier les permissions
    // car on ne peut pas facilement accéder à la DB depuis le middleware
  }

  // Routes protégées pour les joueurs connectés
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/teams/create')) {
    const sessionToken = request.cookies.get('next-auth.session-token') || 
                         request.cookies.get('__Secure-next-auth.session-token')
    
    if (!sessionToken) {
      return NextResponse.redirect(new URL('/auth/signin?callbackUrl=' + pathname, request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/staff/:path*', '/dashboard/:path*', '/teams/create/:path*'],
}
