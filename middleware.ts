import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = [
  { prefix: "/admin", role: "admin" },
  { prefix: "/profile", role: "user" },
  { prefix: "/orders", role: "user" }
];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const route = protectedRoutes.find((item) => pathname === item.prefix || pathname.startsWith(`${item.prefix}/`));

  if (!route) return NextResponse.next();

  const role = request.cookies.get("lune-auth-role")?.value;

  if (role !== route.role) {
    const url = request.nextUrl.clone();
    const redirectTarget = `${pathname}${request.nextUrl.search}`;

    url.pathname = "/";
    url.search = "";
    url.searchParams.set("auth", route.role);
    url.searchParams.set("redirect", redirectTarget);

    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/profile/:path*", "/orders/:path*"]
};