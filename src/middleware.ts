import { getSessionCookie } from "better-auth/cookies";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  // Se não tem sessão, redireciona só nas rotas protegidas (que estão no matcher)
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/authentication", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/patients",
    "/doctors",
    "/appointments",
    // NÃO colocar aqui:
    // "/authentication", "/subscription", "/clinic-form"
    // Assim essas páginas ficam livres mesmo sem sessão
  ],
};
