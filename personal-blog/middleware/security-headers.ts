import { NextResponse } from "next/server";

export function middleware() {
  // Clone the response
  const response = NextResponse.next();

  // Set security headers
  const headers = response.headers;

  // Basic security headers
  headers.set("X-DNS-Prefetch-Control", "on");
  headers.set("X-XSS-Protection", "1; mode=block");
  headers.set("X-Frame-Options", "SAMEORIGIN");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Only set Strict-Transport-Security header in production
  if (process.env.NODE_ENV === "production") {
    headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  // Permissions policy to limit features
  headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );

  return response;
}

export const config = {
  matcher: [
    // Match all routes except for static files, api routes, and _next
    "/((?!_next/static|_next/image|favicon.ico|images/|api/).*)",
  ],
};
