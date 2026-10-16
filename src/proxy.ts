import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = ["/login", "/verifikasi"];
const publicApiRoutes = ["/api/auth", "/api/verifikasi", "/api/cron"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
  const isPublicApiRoute = publicApiRoutes.some((route) => pathname.startsWith(route));

  if (isPublicRoute || isPublicApiRoute || pathname === "/") {
    return NextResponse.next();
  }

  const session = await auth();

  if (!session?.user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = session.user.role;

  if (pathname.startsWith("/anggota") || pathname.startsWith("/persetujuan") || pathname.startsWith("/kta")) {
    if (role !== "SEKRETARIS") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  if (pathname.startsWith("/monitoring")) {
    if (role !== "KETUA") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  if (pathname.startsWith("/pengaturan/periode")) {
    if (role !== "SEKRETARIS") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  if (pathname.startsWith("/pengaturan/pengguna")) {
    if (role !== "SUPERADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
