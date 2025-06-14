import { getSessionCookie } from "better-auth/cookies";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  // Se não tem sessão, redireciona para authentication
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/authentication", request.url));
  }

  return NextResponse.next();
}

// AJUSTAR O MATCHER - remover subscription e clinic-form
export const config = {
  matcher: [
    "/dashboard",
    "/patients",
    "/doctors",
    "/appointments",
    // NÃO incluir "/subscription" e "/clinic-form" aqui
    // Essas rotas fazem parte do fluxo pós-login
  ],
};
