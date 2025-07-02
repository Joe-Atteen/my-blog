import { NextResponse } from "next/server";
import { createServerClient } from "@/app/supabase-server";

export async function GET() {
  try {
    // Create Supabase server client using the imported function
    const supabase = await createServerClient();

    // Check current session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "No valid session found",
          authStatus: "unauthenticated",
        },
        { status: 401 }
      );
    }

    // Return successful status
    return NextResponse.json({
      success: true,
      message: "Authentication valid for admin access",
      userId: session.user.id,
      email: session.user.email,
      role: session.user.role,
      authStatus: "authenticated",
    });
  } catch (error) {
    console.error("API auth error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error checking authentication",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
