import { pool } from '@/lib/db';
import { mongoDb, audit } from '@/lib/mongo';
import { deliveryStatusSchema } from '@/lib/validate';
import { withAuth, json, readJson } from '@/lib/api';

export const PATCH = withAuth(['ADMIN', 'VOLUNTEER'], async (req, session, { params }) => {
  const { id } = await params;
  const { status, note } = deliveryStatusSchema.parse(await readJson(req));
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [rows] = await conn.query(
      'SELECT volunteer_id FROM pickup_delivery WHERE delivery_id = ? FOR UPDATE',
      [id]
    );

    if (!rows.length) {
      await conn.rollback();
      return json({ error: 'Delivery not found' }, 404);
    }

    const sets = ['status = ?'];

    if (status === 'IN_TRANSIT') {
      sets.push('pickup_time = COALESCE(pickup_time, NOW())');
    }

    if (status === 'DELIVERED') {
      sets.push('delivery_time = NOW()');
    }

    await conn.query(
      `UPDATE pickup_delivery SET ${sets.join(', ')} WHERE delivery_id = ?`,
      [status, id]
    );

    if (rows[0].volunteer_id) {
      const free = status === 'DELIVERED' || status === 'CANCELLED';

      await conn.query(
        'UPDATE volunteer SET availability = ? WHERE volunteer_id = ?',
        [free ? 1 : 0, rows[0].volunteer_id]
      );
    }

    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }

  try {
    const db = await mongoDb();
    await db.collection('delivery_events').insertOne({
      delivery_id: id,
      status,
      location: 'Status update',
      note,
      recorded_by: session.username,
      ts: new Date(),
    });
  } catch (e) {
    console.error('event insert failed:', e.message);
  }

  await audit(session, 'UPDATE_STATUS', 'pickup_delivery', id, { status });
  return json({ ok: true });
});
