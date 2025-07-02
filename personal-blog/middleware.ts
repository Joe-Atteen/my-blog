import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Middleware to protect admin routes
export async function middleware(request: NextRequest) {
  // Only protect admin routes
  if (!request.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // Development bypass option - only works in development mode
  if (
    process.env.NODE_ENV === "development" &&
    request.nextUrl.searchParams.has("bypass")
  ) {
    console.log("Auth bypass activated for development");
    return NextResponse.next();
  }

  // Enable auth check for admin pages

  try {
    // Check for authentication cookies before creating client
    const refreshToken = request.cookies.get("sb-refresh-token");
    const accessToken = request.cookies.get("sb-access-token");

    // Log detailed cookie information for debugging
    console.log("Middleware - Auth Check - Available cookies:");
    const allCookies = request.cookies.getAll();
    console.log(
      allCookies.map((c) => `${c.name}: ${c.value ? "Present" : "Empty"}`)
    );

    // If no tokens at all, redirect to login - no need to try Supabase auth
    if (!refreshToken && !accessToken) {
      console.log("Middleware: No auth tokens found, redirecting to login");
      return NextResponse.redirect(new URL("/fix-tokens", request.url));
    }

    // Create a Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return request.cookies.get(name)?.value;
          },
          set() {
            // Setting cookies isn't required for auth in middleware
          },
          remove() {
            // Removing cookies isn't required for auth in middleware
          },
        },
      }
    );

    // Check auth status - but catch errors related to token issues
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        // If no valid session, redirect to login
        console.log("Middleware: No valid session, redirecting to login");

        // Create a response that redirects and clears auth cookies
        const response = NextResponse.redirect(new URL("/login", request.url));

        // Clear problematic cookies
        response.cookies.delete("sb-refresh-token");
        response.cookies.delete("sb-access-token");

        return response;
      }

      // Check if this user has admin privileges based on their profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*") // Get full profile for debugging
        .eq("id", session.user.id)
        .single();

      // Log detailed debugging information
      console.log("Admin Middleware - DEBUG INFO:");
      console.log(`User email: ${session.user.email}, ID: ${session.user.id}`);
      console.log(
        `Profile lookup result:`,
        profileError ? `ERROR: ${profileError.message}` : profile
      );

      // If there's an error fetching the profile or the profile indicates the user is not an admin
      if (profileError || !profile?.is_admin) {
        console.log(
          "Middleware: User not authorized for admin access (profile check):",
          session.user.email,
          profileError
            ? `Error: ${profileError.message}`
            : `Admin status: ${profile?.is_admin}`
        );
        return NextResponse.redirect(new URL("/unauthorized", request.url));
      }

      // If we got here, access is allowed
      console.log(
        `Admin access GRANTED to ${session.user.email} (ID: ${session.user.id})`
      );
    } catch (sessionError) {
      console.error("Session check error:", sessionError);

      // Create a response that redirects and clears auth cookies
      const response = NextResponse.redirect(new URL("/login", request.url));

      // Clear problematic cookies
      response.cookies.delete("sb-refresh-token");
      response.cookies.delete("sb-access-token");

      return response;
    }

    // Allow the request to proceed
    return NextResponse.next();
  } catch (error) {
    console.error("Middleware auth error:", error);

    // On any error, redirect to login with cookie cleanup
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("sb-refresh-token");
    response.cookies.delete("sb-access-token");

    return response;
  }
}

// Define which routes to run the middleware on
export const config = {
  matcher: ["/admin/:path*"],
};
