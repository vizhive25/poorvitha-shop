// Loads the starter catalogue into the database. Safe to re-run: existing products
// (including ones you edited in the admin panel) are left untouched.
import { PrismaClient } from "@prisma/client";
import { loadStarterCatalogue } from "../src/lib/starter";

const db = new PrismaClient();
loadStarterCatalogue(db)
  .then((r) => console.log(`Seeded ${r.created} new products (${r.total} in source).`))
  .finally(() => db.$disconnect());
