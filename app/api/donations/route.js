import { randomUUID } from 'crypto';
import { q } from '@/lib/db';
import { mongoDb, audit } from '@/lib/mongo';
import { donationSchema } from '@/lib/validate';
import { withAuth, json, readJson } from '@/lib/api';

export const dynamic = 'force-dynamic';

// GET /api/donations?q=bread  -> list (full-text search on food_name when q is given)
export const GET = withAuth(null, async (req) => {
  const search = (new URL(req.url).searchParams.get('q') || '').trim().slice(0, 100);
  const where = search
    ? 'WHERE (MATCH(fd.food_name) AGAINST (? IN NATURAL LANGUAGE MODE) OR fd.food_name LIKE ?)'
    : '';
  const params = search ? [search, `%${search}%`] : [];

  const rows = await q(
    `SELECT fd.donation_id, fd.food_name, fd.food_type, fd.quantity,
            GetRemainingDonationQuantity(fd.donation_id) AS remaining_quantity,
            fd.food_condition, fd.preparation_time, fd.expiry_time, fd.location, fd.status,
            d.name AS donor_name
       FROM food_donation fd
       JOIN food_donor d ON d.donor_id = fd.donor_id
       ${where}
      ORDER BY fd.expiry_time ASC
      LIMIT 200`,
    params
  );

  // Attach flexible metadata (allergens, notes) stored in MongoDB. Optional: failure is tolerated.
  try {
    if (rows.length) {
      const db = await mongoDb();
      const docs = await db
        .collection('food_metadata')
        .find({ donation_id: { $in: rows.map((r) => r.donation_id) } })
        .toArray();
      const byId = new Map(docs.map((d) => [d.donation_id, d]));
      rows.forEach((r) => {
        const m = byId.get(r.donation_id);
        r.allergens = m?.allergens?.join(', ') || null;
        r.storage_notes = m?.storage_notes || null;
      });
    }
  } catch (e) {
    console.error('metadata lookup failed:', e.message);
  }
  return json({ rows });
});

export const POST = withAuth(['ADMIN', 'DONOR'], async (req, session) => {
  const d = donationSchema.parse(await readJson(req));
  const id = randomUUID();

  // Relational part: CHECK constraints + before_food_donation_insert trigger run here.
  await q(
    `INSERT INTO food_donation
       (donation_id, donor_id, food_name, food_type, quantity, preparation_time,
        expiry_time, food_condition, location, status)
     VALUES (?,?,?,?,?,?,?,?,?, 'AVAILABLE')`,
    [id, d.donor_id, d.food_name, d.food_type, d.quantity, d.preparation_time,
     d.expiry_time, d.food_condition, d.location]
  );

  // Document part: flexible, per-donation metadata goes to MongoDB.
  let mongoStored = true;
  try {
    const db = await mongoDb();
    await db.collection('food_metadata').insertOne({
      donation_id: id,
      allergens: d.allergens
        ? d.allergens.split(',').map((a) => a.trim().toLowerCase()).filter(Boolean)
        : [],
      storage_notes: d.storage_notes,
      created_by: session.username,
      created_at: new Date(),
    });
  } catch (e) {
    mongoStored = false;
    console.error('metadata insert failed:', e.message);
  }

  await audit(session, 'CREATE', 'food_donation', id, { food_name: d.food_name, quantity: d.quantity });
  return json({ donation_id: id, mongoStored }, 201);
});
