import { MongoClient } from 'mongodb';

const g = globalThis;
const state = g._efsMongo ?? (g._efsMongo = { promise: null, indexed: false });

export async function mongoDb() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set');
  if (!state.promise) {
    state.promise = new MongoClient(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 4000,
    })
      .connect()
      .catch((e) => {
        state.promise = null; // allow retry on next request
        throw e;
      });
  }
  const client = await state.promise;
  const db = client.db(process.env.MONGODB_DB || 'ecofoodsync_nosql');

  if (!state.indexed) {
    await Promise.all([
      db.collection('delivery_events').createIndex({ delivery_id: 1, ts: -1 }),
      db.collection('audit_logs').createIndex({ ts: -1 }),
      db.collection('food_metadata').createIndex({ donation_id: 1 }, { unique: true }),
      db.collection('food_metadata').createIndex({ allergens: 1 }),
    ]);
    state.indexed = true;
  }
  return db;
}

// Audit logging must never break the main request.
export async function audit(session, action, entity, entityId, details = {}) {
  try {
    const db = await mongoDb();
    await db.collection('audit_logs').insertOne({
      ts: new Date(),
      user: session?.username ?? 'anonymous',
      role: session?.role ?? null,
      action,
      entity,
      entity_id: entityId ?? null,
      details,
    });
  } catch (e) {
    console.error('audit log failed:', e.message);
  }
}
