// Recovery / setup from the server's command line. Creates a staff account, or resets the password
// of an existing one (and signs it out everywhere). Use this if the owner is locked out.
//   npx tsx scripts/create-user.ts owner@yourdomain.in "a-long-password-1" OWNER "Your Name"
import { PrismaClient } from "@prisma/client";
import { hashPassword, passwordProblem } from "../src/lib/password";

const [email, password, role = "OWNER", name = "Owner"] = process.argv.slice(2);
const db = new PrismaClient();

(async () => {
  if (!email || !password) { console.error('Usage: npx tsx scripts/create-user.ts <email> <password> [OWNER|MANAGER|ORDERS] ["Name"]'); process.exit(1); }
  if (!["OWNER", "MANAGER", "ORDERS"].includes(role)) { console.error("Role must be OWNER, MANAGER or ORDERS"); process.exit(1); }
  const problem = passwordProblem(password);
  if (problem) { console.error(problem); process.exit(1); }
  const e = email.trim().toLowerCase();
  const passwordHash = await hashPassword(password);
  const existing = await db.user.findUnique({ where: { email: e } });
  if (existing) {
    await db.user.update({ where: { id: existing.id }, data: { passwordHash, active: true, role, mustChangePassword: true, sessionVersion: { increment: 1 } } });
    console.log(`Updated ${e}: password reset, role ${role}, account active. They must choose a new password at next sign-in.`);
  } else {
    await db.user.create({ data: { email: e, name, role, passwordHash, mustChangePassword: true } });
    console.log(`Created ${role} ${e}. They must choose a new password at first sign-in.`);
  }
  await db.$disconnect();
})();
