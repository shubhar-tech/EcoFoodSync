import { randomUUID } from 'crypto';
import { pool, q } from '@/lib/db';
import { mongoDb, audit } from '@/lib/mongo';
import { deliverySchema } from '@/lib/validate';
import { withAuth, json, readJson } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const GET = withAuth(null, async () => {
  const rows = await q(
    `SELECT pd.delivery_id, fd.food_name, fd.quantity,
            d.name AS donor_name, v.name AS volunteer_name,
            c.name AS charity_name, c.location AS delivery_address,
            pd.vehicle_type, pd.pickup_time, pd.delivery_time,
            pd.status, pd.notes AS delivery_notes
       FROM pickup_delivery pd
       JOIN food_donation fd ON fd.donation_id = pd.donation_id
       JOIN food_donor d ON d.donor_id = fd.donor_id
       LEFT JOIN volunteer v ON v.volunteer_id = pd.volunteer_id
       JOIN charity_or_ngo c ON c.charity_id = pd.charity_id
      ORDER BY pd.pickup_time DESC
      LIMIT 200`
  );

  return json({ rows });
});

export const POST = withAuth(['ADMIN'], async (req, session) => {
  const d = deliverySchema.parse(await readJson(req));
  const id = randomUUID();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [vol] = await conn.query(
      'SELECT availability FROM volunteer WHERE volunteer_id = ? FOR UPDATE',
      [d.volunteer_id]
    );

    if (!vol.length) {
      await conn.rollback();
      return json({ error: 'Volunteer not found' }, 404);
    }

    if (!vol[0].availability) {
      await conn.rollback();
      return json({ error: 'Volunteer is not available' }, 409);
    }

    await conn.query(
      `INSERT INTO pickup_delivery
         (delivery_id, donation_id, volunteer_id, charity_id,
          vehicle_type, status, notes)
       VALUES (?, ?, ?, ?, ?, 'PENDING', ?)`,
      [id, d.donation_id, d.volunteer_id, d.charity_id,
       d.vehicle_type, d.delivery_notes]
    );

    await conn.query(
      'UPDATE volunteer SET availability = 0 WHERE volunteer_id = ?',
      [d.volunteer_id]
    );

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
      status: 'PENDING',
      location: 'Dispatch',
      note: 'Delivery assigned',
      recorded_by: session.username,
      ts: new Date(),
    });
  } catch (e) {
    console.error('event insert failed:', e.message);
  }

  await audit(session, 'CREATE', 'pickup_delivery', id, d);
  return json({ delivery_id: id }, 201);
});
