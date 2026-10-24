import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// Route này phải chạy động mỗi lần gọi — không cache, không prerender lúc build.
export const dynamic = "force-dynamic";

/**
 * Health-check: kiểm tra app sống và đọc được Neon Postgres qua DATABASE_URL.
 * Không lộ connection string hay chi tiết lỗi ra ngoài.
 */
export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { status: "error", db: "not_configured" },
      { status: 503 },
    );
  }

  try {
    const db = getDb();
    await db.execute(sql`select 1`);
    return NextResponse.json({ status: "ok", db: "up" }, { status: 200 });
  } catch {
    return NextResponse.json(
      { status: "error", db: "down" },
      { status: 503 },
    );
  }
}
