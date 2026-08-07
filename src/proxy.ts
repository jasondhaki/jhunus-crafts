import { NextResponse } from "next/server";
import { auth } from "../auth";

export default auth((req) => {
  const { nextUrl } = req;
  const user = req.auth?.user;

  if (!user) {
    const callbackUrl = encodeURIComponent(nextUrl.pathname + nextUrl.search);
    return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, nextUrl));
  }

  if (nextUrl.pathname.startsWith("/admin") && user.role !== "ADMIN") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
};
