import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  exchangeCodeForTokens,
  getUserInfo,
} from "@/lib/integrations/google-calendar";

// GET /api/auth/google/callback - Handle Google OAuth callback
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Handle OAuth errors
    if (error) {
      console.error("Google OAuth error:", error);
      return NextResponse.redirect(
        new URL(
          `/settings/integrations/google?error=${encodeURIComponent(error)}`,
          request.url
        )
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL(
          "/settings/integrations/google?error=missing_params",
          request.url
        )
      );
    }

    // Decode state
    let stateData: { userId: string; workspaceId: string; timestamp: number };
    try {
      stateData = JSON.parse(Buffer.from(state, "base64").toString());
    } catch (e) {
      return NextResponse.redirect(
        new URL("/settings/integrations/google?error=invalid_state", request.url)
      );
    }

    // Verify timestamp (5 minute expiry)
    if (Date.now() - stateData.timestamp > 5 * 60 * 1000) {
      return NextResponse.redirect(
        new URL("/settings/integrations/google?error=state_expired", request.url)
      );
    }

    const supabase = await createClient();

    // Verify the user is still authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== stateData.userId) {
      return NextResponse.redirect(
        new URL("/settings/integrations/google?error=unauthorized", request.url)
      );
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // Get user info from Google
    const googleUser = await getUserInfo(tokens.access_token);

    // Check if integration already exists
    const { data: existing } = await (supabase as any)
      .from("crm_integrations")
      .select("id")
      .eq("workspace_id", stateData.workspaceId)
      .eq("provider", "google")
      .single();

    if (existing) {
      // Update existing integration
      const { error: updateError } = await (supabase as any)
        .from("crm_integrations")
        .update({
          status: "connected",
          config: {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expiry_date: tokens.expiry_date,
          },
          metadata: {
            email: googleUser.email,
            name: googleUser.name,
            picture: googleUser.picture,
          },
          error_message: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (updateError) {
        throw updateError;
      }
    } else {
      // Create new integration
      const { error: insertError } = await (supabase as any)
        .from("crm_integrations")
        .insert({
          workspace_id: stateData.workspaceId,
          provider: "google",
          status: "connected",
          config: {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expiry_date: tokens.expiry_date,
          },
          metadata: {
            email: googleUser.email,
            name: googleUser.name,
            picture: googleUser.picture,
          },
          connected_at: new Date().toISOString(),
          created_by: user.id,
        });

      if (insertError) {
        if (insertError.code === "42P01") {
          return NextResponse.redirect(
            new URL(
              "/settings/integrations/google?error=table_not_found",
              request.url
            )
          );
        }
        throw insertError;
      }
    }

    // Redirect to Google settings page on success
    return NextResponse.redirect(
      new URL("/settings/integrations/google?success=true", request.url)
    );
  } catch (error) {
    console.error("Error handling Google OAuth callback:", error);
    return NextResponse.redirect(
      new URL("/settings/integrations/google?error=callback_failed", request.url)
    );
  }
}
