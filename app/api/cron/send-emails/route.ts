import { NextRequest, NextResponse } from "next/server";
import { processQueue, getQueueStats, cleanupQueue } from "@/lib/email/email-queue";

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;

  // If no secret configured, allow in development
  if (!cronSecret && process.env.NODE_ENV === "development") {
    return true;
  }

  // Check Authorization header
  const authHeader = request.headers.get("Authorization");
  if (authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  // Check x-cron-secret header (for Vercel cron)
  const cronHeader = request.headers.get("x-cron-secret");
  if (cronHeader === cronSecret) {
    return true;
  }

  return false;
}

// GET /api/cron/send-emails - Process email queue
// This should be called periodically (e.g., every minute via Vercel Cron)
export async function GET(request: NextRequest) {
  try {
    // Verify request is authorized
    if (!verifyCronSecret(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const startTime = Date.now();

    // Get queue stats before processing
    const statsBefore = await getQueueStats();

    // Process queue with batch size of 20
    const result = await processQueue(20);

    // Get queue stats after processing
    const statsAfter = await getQueueStats();

    const duration = Date.now() - startTime;

    console.log(
      `[Email Cron] Processed ${result.processed} emails ` +
        `(${result.successful} sent, ${result.failed} failed) in ${duration}ms`
    );

    return NextResponse.json({
      success: true,
      processed: result.processed,
      successful: result.successful,
      failed: result.failed,
      duration: `${duration}ms`,
      queue: {
        before: statsBefore,
        after: statsAfter,
      },
    });
  } catch (error) {
    console.error("[Email Cron] Error processing queue:", error);
    return NextResponse.json(
      { error: "Failed to process email queue" },
      { status: 500 }
    );
  }
}

// POST /api/cron/send-emails - Manual trigger with options
export async function POST(request: NextRequest) {
  try {
    // Verify request is authorized
    if (!verifyCronSecret(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { action = "process", batchSize = 20, cleanupDays = 30 } = body;

    switch (action) {
      case "process": {
        const result = await processQueue(batchSize);
        return NextResponse.json({
          success: true,
          action: "process",
          ...result,
        });
      }

      case "cleanup": {
        const cleaned = await cleanupQueue(cleanupDays);
        return NextResponse.json({
          success: true,
          action: "cleanup",
          cleaned,
          message: `Cleaned up ${cleaned} old emails (older than ${cleanupDays} days)`,
        });
      }

      case "stats": {
        const stats = await getQueueStats();
        return NextResponse.json({
          success: true,
          action: "stats",
          stats,
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[Email Cron] Error:", error);
    return NextResponse.json(
      { error: "Failed to execute action" },
      { status: 500 }
    );
  }
}
