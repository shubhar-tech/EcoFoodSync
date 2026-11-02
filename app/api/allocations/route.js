import { randomUUID } from 'crypto';
import { pool, q } from '@/lib/db';
import { audit } from '@/lib/mongo';
import { allocationSchema } from '@/lib/validate';
import { withAuth, json, readJson } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const GET = withAuth(null, async () => {
  const rows = await q(
    `SELECT a.allocation_id, fd.food_name, c.name AS charity_name,
            a.allocated_quantity, a.allocation_time, a.status
       FROM allocation a
       JOIN food_donation fd ON fd.donation_id = a.donation_id
       JOIN charity_or_ngo c ON c.charity_id = a.charity_id
      ORDER BY a.allocation_time DESC
      LIMIT 200`
  );
  // Stored procedure: donated vs allocated vs remaining per donation
  const [result] = await pool.query('CALL GetDonationAllocationSummary()');
  return json({ rows, summary: result[0] });
});

export const POST = withAuth(['ADMIN'], async (req, session) => {
  const d = allocationSchema.parse(await readJson(req));
  const id = randomUUID();
  // before_allocation_insert trigger rejects over-allocation (SQLSTATE 45000)
  await q(
    `INSERT INTO allocation (allocation_id, donation_id, charity_id, allocated_quantity, status)
     VALUES (?,?,?,?, 'PENDING')`,
    [id, d.donation_id, d.charity_id, d.allocated_quantity]
  );
  await audit(session, 'CREATE', 'allocation', id, d);
  return json({ allocation_id: id }, 201);
});
