/**
 * Script para crear el primer administrador en la BD.
 * Uso: npx tsx scripts/crearAdmin.ts <email> <nombre> <password>
 */
import "dotenv/config";
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const hash = await new Promise<Buffer>((resolve, reject) =>
    crypto.scrypt(password, salt, 64, (err, key) => (err ? reject(err) : resolve(key))),
  );
  return `scrypt:${salt.toString("hex")}:${hash.toString("hex")}`;
}

async function main() {
  const [email, nombre, password] = process.argv.slice(2);
  if (!email || !nombre || !password) {
    console.error("Uso: npx tsx scripts/crearAdmin.ts <email> <nombre> <password>");
    process.exit(1);
  }

  const existente = await prisma.administrador.findUnique({ where: { email } });
  if (existente) {
    console.error(`Ya existe un administrador con email: ${email}`);
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);
  const admin = await prisma.administrador.create({
    data: { email, nombre, passwordHash },
  });

  console.log(`✅ Administrador creado: ${admin.nombre} (${admin.email}) — id: ${admin.id}`);
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
