import { defineConfig } from "drizzle-kit";

// Migration/schema tools của Drizzle Kit.
// File migration sinh ra nằm trong thư mục ./drizzle và được commit vào repo.
export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
