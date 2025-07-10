import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;
  const isAuthPage = req.nextUrl.pathname.startsWith('/login');

  if (pathname === '/health') {
    return new NextResponse('OK', { status: 200 });
  }

  if (isAuthPage) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/dashboard', req.nextUrl.origin));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$|.*\\.jpg$).*)" ],
}

