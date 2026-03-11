/**
 * import-data.js
 * 
 * Imports SWIFT message documents into MongoDB.
 * Automatically handles ALL input formats:
 *   1. Array of { message, payloads } objects  → inserts directly
 *   2. { content: [...] } pagination wrapper   → unwraps then inserts
 *   3. Array of bare message objects            → wraps in { message, payloads: [] }
 *   4. Single { content: [...] } object        → unwraps
 *
 * Usage:
 *   node import-data.js                              # imports swift_messages_100.json from parent dir
 *   node import-data.js ../swift_messages_100.json   # explicit path
 *   node import-data.js /path/to/any-file.json       # any path
 *
 * DB: ampdb   Collection: jason_swift
 */

const { MongoClient } = require("mongodb");
const fs   = require("fs");
const path = require("path");

const MONGO_URI  = "mongodb://localhost:27017";
const DB_NAME    = "ampdb";
const COLLECTION = "jason_swift";

// Default: look for swift_messages_100.json in the same folder as this script or parent
const DEFAULT_PATHS = [
  path.join(__dirname, "swift_messages_100.json"),
  path.join(__dirname, "../swift_messages_100.json"),
  path.join(__dirname, "../../swift_messages_100.json"),
];

function resolveJsonPath() {
  if (process.argv[2]) return path.resolve(process.argv[2]);
  for (const p of DEFAULT_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error(
    "No JSON file specified and swift_messages_100.json not found.\n" +
    "Usage: node import-data.js <path-to-file.json>"
  );
}

async function run() {
  const jsonPath = resolveJsonPath();
  console.log(`\n📂  Reading: ${jsonPath}`);

  const raw = fs.readFileSync(jsonPath, "utf-8");
  let parsed = JSON.parse(raw);

  // ── Normalise to flat array ──────────────────────────────────────────────
  let docs = [];

  if (Array.isArray(parsed)) {
    docs = parsed;
  } else if (parsed.content && Array.isArray(parsed.content)) {
    // Pagination wrapper { content: [...], totalElements: N, ... }
    console.log(`ℹ️   Unwrapping pagination wrapper — found ${parsed.content.length} items in 'content'`);
    docs = parsed.content;
  } else {
    console.warn("⚠️   Unexpected JSON shape. Treating as single document.");
    docs = [parsed];
  }

  // ── Shape each document as { message, payloads } ─────────────────────────
  const shaped = docs.map((d, i) => {
    if (d.message && typeof d.message === "object") {
      // Already correct shape
      return { message: d.message, payloads: d.payloads || [] };
    }
    // Bare message object (no wrapper)
    console.warn(`ℹ️   Doc[${i}] has no 'message' key — wrapping bare object`);
    return { message: d, payloads: [] };
  });

  console.log(`✅  Parsed ${shaped.length} documents`);

  // ── Connect & import ─────────────────────────────────────────────────────
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    console.log(`🔗  Connected to MongoDB at ${MONGO_URI}`);

    const col = client.db(DB_NAME).collection(COLLECTION);

    // Drop existing data so we start clean
    await col.drop().catch(() => {});
    console.log(`🗑️   Dropped existing '${DB_NAME}.${COLLECTION}'`);

    // Insert in batches of 50 to avoid memory issues with large payloads
    const BATCH = 50;
    let inserted = 0;
    for (let i = 0; i < shaped.length; i += BATCH) {
      const batch = shaped.slice(i, i + BATCH);
      const res = await col.insertMany(batch);
      inserted += res.insertedCount;
      process.stdout.write(`   Inserted ${inserted}/${shaped.length}\r`);
    }
    console.log(`\n✅  Inserted ${inserted} documents into '${DB_NAME}.${COLLECTION}'`);

    // Summary stats
    const [codes, owners, channels, countries, statuses] = await Promise.all([
      col.distinct("message.messageCode"),
      col.distinct("message.owner"),
      col.distinct("message.networkChannel"),
      col.distinct("message.country"),
      col.distinct("message.status"),
    ]);
    console.log("\n📊  Collection summary:");
    console.log(`   messageCodes (${codes.length}):    `, codes.sort().join(", "));
    console.log(`   owners       (${owners.length}):    `, owners.sort().join(", "));
    console.log(`   networkChannels (${channels.length}):`, channels.sort().join(", "));
    console.log(`   countries    (${countries.length}):  `, countries.sort().join(", "));
    console.log(`   statuses     (${statuses.length}):   `, statuses.sort().join(", "));
    console.log(`\n🚀  Done! Start Spring Boot and open http://localhost:3000`);

  } catch (err) {
    console.error("\n✖  Error:", err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

run();
