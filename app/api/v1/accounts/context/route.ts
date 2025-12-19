import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAccountContext } from "@/lib/accounts/account-management";

// GET /api/v1/accounts/context - Get account context for switching
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get account context
    const context = await getAccountContext(user.id);

    if (!context) {
      return NextResponse.json(
        { error: "Could not determine account context" },
        { status: 404 }
      );
    }

    return NextResponse.json(context);
  } catch (error) {
    console.error("Error getting account context:", error);
    return NextResponse.json(
      { error: "Failed to get account context" },
      { status: 500 }
    );
  }
}
