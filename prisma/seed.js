const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv/config');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not defined in the environment.");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clear any existing users and other data to start clean
  await prisma.user.deleteMany({});
  await prisma.client.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.quotation.deleteMany({});
  await prisma.activityLog.deleteMany({});
  
  // Hash the requested password
  const passwordHash = bcrypt.hashSync('Matt@4321admin', 10);

  // Create the single admin user
  await prisma.user.create({
    data: {
      email: "admin@mattengg.com",
      passwordHash: passwordHash,
      name: "Admin User",
      role: "admin",
      status: "active"
    }
  });

  console.log("Database seeded successfully with the admin user!");
  await pool.end();
}

main().catch(err => {
  console.error("Error seeding database:", err);
  process.exit(1);
});
