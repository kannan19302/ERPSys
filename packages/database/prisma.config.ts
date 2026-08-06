import { defineConfig } from "@prisma/config";

// `--schema prisma/schema` (a folder, since the R2 multi-file split) makes
// Prisma resolve migrations relative to the *schema* directory — it looked in
// prisma/schema/migrations, found nothing, and reported "No pending migrations
// to apply" while 175 migrations sat in prisma/migrations. A `migrate deploy`
// that silently applies nothing and exits 0 is worse than one that fails, so
// the directory is pinned explicitly here.
export default defineConfig({
  schema: "prisma/schema",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL || "postgresql://localhost:5432/unerp",
  },
});
