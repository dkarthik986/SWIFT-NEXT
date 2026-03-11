/**
 * fix-mongodb.js
 *
 * ONE-TIME FIX: Repairs the jason_swift collection when data was imported
 * as a wrapper document { content: [{message,payloads},...] } instead of
 * individual { message, payloads } documents.
 *
 * Run this ONCE to fix your existing MongoDB data:
 *   node fix-mongodb.js
 *
 * After running, your collection will have proper individual documents.
 */

const { MongoClient } = require("mongodb");

const MONGO_URI  = "mongodb://localhost:27017";
const DB_NAME    = "ampdb";
const COLLECTION = "jason_swift";

async function fix() {
    const client = new MongoClient(MONGO_URI);
    try {
        await client.connect();
        console.log("🔗  Connected to MongoDB");

        const col = client.db(DB_NAME).collection(COLLECTION);
        const total = await col.countDocuments();
        console.log(`📊  Found ${total} document(s) in '${DB_NAME}.${COLLECTION}'`);

        // Check if data is already in the correct shape
        const sample = await col.findOne({ "message.messageCode": { $exists: true } });
        if (sample) {
            console.log(`✅  Collection already has correct structure (found message.messageCode).`);
            console.log(`    Total docs: ${total}. No fix needed.`);
            return;
        }

        // Check if stored as wrapper { content: [...] }
        const wrapperDoc = await col.findOne({ content: { $exists: true } });
        if (!wrapperDoc) {
            console.log("⚠️   No 'content' wrapper found either. Collection may be empty.");
            return;
        }

        console.log("🔧  Found wrapper structure { content: Array }. Fixing...");

        // Gather all individual message docs from all wrapper documents
        const allWrappers = await col.find({ content: { $exists: true } }).toArray();
        const individualDocs = [];

        for (const wrapper of allWrappers) {
            const items = wrapper.content;
            if (!Array.isArray(items)) continue;
            for (const item of items) {
                if (item && item.message) {
                    individualDocs.push({
                        message:  item.message,
                        payloads: item.payloads || []
                    });
                }
            }
        }

        console.log(`📦  Extracted ${individualDocs.length} individual message documents`);

        if (individualDocs.length === 0) {
            console.log("❌  No valid documents found inside content arrays.");
            return;
        }

        // Drop the bad data and re-insert properly
        await col.drop();
        console.log("🗑️   Dropped old collection");

        const result = await col.insertMany(individualDocs);
        console.log(`✅  Inserted ${result.insertedCount} individual documents`);

        // Verify
        const [codes, owners, channels] = await Promise.all([
            col.distinct("message.messageCode"),
            col.distinct("message.owner"),
            col.distinct("message.networkChannel"),
        ]);
        console.log("\n📊  Collection now contains:");
        console.log(`   ${result.insertedCount} documents`);
        console.log(`   messageCodes: ${codes.sort().join(", ")}`);
        console.log(`   owners:       ${owners.sort().join(", ")}`);
        console.log(`   channels:     ${channels.sort().join(", ")}`);
        console.log("\n🚀  Fix complete! Restart Spring Boot and search should work.");

    } catch (err) {
        console.error("✖  Error:", err.message);
        process.exit(1);
    } finally {
        await client.close();
    }
}

fix();
