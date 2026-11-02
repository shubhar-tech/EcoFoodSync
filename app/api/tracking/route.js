import { mongoDb, audit } from '@/lib/mongo';
import { q } from '@/lib/db';
import { eventSchema } from '@/lib/validate';
import { withAuth, json, readJson } from '@/lib/api';

export const dynamic = 'force-dynamic';

// GET /api/tracking?delivery_id=...  -> event timeline from MongoDB
export const GET = withAuth(null, async (req) => {
  const deliveryId = new URL(req.url).searchParams.get('delivery_id');
  if (!deliveryId || deliveryId.length !== 36) return json({ error: 'delivery_id required' }, 400);
  const db = await mongoDb();
  const events = await db
    .collection('delivery_events')
    .find({ delivery_id: deliveryId })
    .sort({ ts: -1 })
    .limit(100)
    .toArray();
  return json({ events });
});

export const POST = withAuth(['ADMIN', 'VOLUNTEER'], async (req, session) => {
  const d = eventSchema.parse(await readJson(req));
  // Make sure the delivery really exists in MySQL before logging events for it.
  const exists = await q('SELECT 1 FROM pickup_delivery WHERE delivery_id = ?', [d.delivery_id]);
  if (!exists.length) return json({ error: 'Delivery not found' }, 404);

  const db = await mongoDb();
  await db.collection('delivery_events').insertOne({
    ...d,
    recorded_by: session.username,
    ts: new Date(),
  });
  await audit(session, 'TRACK_EVENT', 'delivery_events', d.delivery_id, { status: d.status });
  return json({ ok: true }, 201);
});
