import { q } from '@/lib/db';
import { mongoDb } from '@/lib/mongo';
import { withAuth, json } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const GET = withAuth(null, async () => {
  const [counts] = await q(
    `SELECT
       (SELECT COUNT(*) FROM food_donation) AS donations,
       (SELECT COUNT(*) FROM food_donation WHERE status = 'AVAILABLE' AND expiry_time > NOW()) AS available,
       (SELECT COALESCE(SUM(quantity), 0) FROM food_donation) AS total_kg,
       (SELECT COUNT(*) FROM charity_or_ngo) AS charities,
       (SELECT COUNT(*) FROM volunteer) AS volunteers,
       (SELECT COUNT(*) FROM food_request WHERE status = 'OPEN') AS open_requests`
  );
  const active = await q('SELECT * FROM vw_active_deliveries ORDER BY pickup_time DESC LIMIT 20');
  const topDonors = await q(
    `SELECT d.name AS donor_name, SUM(fd.quantity) AS total_quantity
       FROM food_donor d JOIN food_donation fd ON fd.donor_id = d.donor_id
      GROUP BY d.donor_id, d.name
      ORDER BY total_quantity DESC LIMIT 5`
  );

  // NoSQL aggregation pipelines (MongoDB). Dashboard still works if Mongo is down.
  let mongo = null;
  try {
    const db = await mongoDb();
    const [eventsByStatus, topAllergens] = await Promise.all([
      db.collection('delivery_events').aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]).toArray(),
      db.collection('food_metadata').aggregate([
        { $unwind: '$allergens' },
        { $group: { _id: '$allergens', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]).toArray(),
    ]);
    mongo = { eventsByStatus, topAllergens };
  } catch (e) {
    console.error('mongo stats failed:', e.message);
  }
  return json({ counts, active, topDonors, mongo });
});
