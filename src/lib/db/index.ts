import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let cachedDb: NeonHttpDatabase<typeof schema> | null = null;

/**
 * Drizzle client (Neon HTTP) — khởi tạo lazy:
 * chỉ tạo kết nối khi được gọi lần đầu, để `next build` không cần DATABASE_URL.
 * Dùng ở Server Components / Server Actions / Route Handlers, không dùng ở client.
 */
export function getDb(): NeonHttpDatabase<typeof schema> {
  if (cachedDb) return cachedDb;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL chưa được cấu hình");
  }

  const sql = neon(databaseUrl);
  cachedDb = drizzle(sql, { schema });
  return cachedDb;
}
