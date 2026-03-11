/**
 * seed-users.js
 *
 * Creates the user_data collection in ampdb with hashed passwords.
 * Run ONCE before starting the backend:
 *
 *   npm install bcryptjs mongodb
 *   node seed-users.js
 *
 * Test credentials:
 *   EMPLOYEE  →  EMP001 / emp123
 *   ADMIN     →  ADMIN001 / admin123
 */

const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");

const MONGO_URI = "mongodb://localhost:27017";
const DB_NAME = "ampdb";
const COLLECTION = "user_data";

const USERS = [
  {
    employeeId: "ADMIN001",
    password: "admin123",
    role: "ADMIN",
    name: "System Administrator",
    email: "admin@swift.com",
    active: true,
  },
  {
    employeeId: "EMP001",
    password: "emp123",
    role: "EMPLOYEE",
    name: "John Doe",
    email: "john.doe@swift.com",
    active: true,
  },
  {
    employeeId: "EMP002",
    password: "emp456",
    role: "EMPLOYEE",
    name: "Jane Smith",
    email: "jane.smith@swift.com",
    active: true,
  },
];

async function seed() {
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    console.log("🔗  Connected to MongoDB");

    const col = client.db(DB_NAME).collection(COLLECTION);

    // Drop and recreate (clean seed)
    await col.drop().catch(() => {});
    console.log(`🗑️   Dropped existing '${DB_NAME}.${COLLECTION}'`);

    // Hash passwords and insert
    const hashed = await Promise.all(
      USERS.map(async (u) => ({
        ...u,
        password: await bcrypt.hash(u.password, 10),
        createdAt: new Date(),
      }))
    );

    await col.insertMany(hashed);
    console.log(`✅  Inserted ${hashed.length} users into '${DB_NAME}.${COLLECTION}'`);

    // Create unique index on employeeId
    await col.createIndex({ employeeId: 1 }, { unique: true });
    console.log("📑  Created unique index on employeeId");

    console.log("\n👤  Test credentials:");
    USERS.forEach((u) => {
      console.log(`   [${u.role.padEnd(8)}]  ${u.employeeId.padEnd(12)} / ${u.password}`);
    });
  } catch (err) {
    console.error("✖  Error:", err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seed();