import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthorizationUrl } from "@/lib/integrations/google-calendar";

// GET /api/auth/google - Initiate Google OAuth flow
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // Redirect to login if not authenticated
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", "/settings/integrations/google");
      return NextResponse.redirect(loginUrl);
    }

    // Get user's workspace
    const { data: profile } = await (supabase as any)
      .from("profiles")
      .select("workspace_id")
      .eq("id", user.id)
      .single();

    if (!profile?.workspace_id) {
      return NextResponse.redirect(
        new URL("/settings/integrations?error=no_workspace", request.url)
      );
    }

    // Create state parameter with user and workspace info
    const state = Buffer.from(
      JSON.stringify({
        userId: user.id,
        workspaceId: profile.workspace_id,
        timestamp: Date.now(),
      })
    ).toString("base64");

    // Get authorization URL
    const authUrl = getAuthorizationUrl(state);

    // Redirect to Google OAuth
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Error initiating Google OAuth:", error);
    return NextResponse.redirect(
      new URL("/settings/integrations?error=oauth_failed", request.url)
    );
  }
}
