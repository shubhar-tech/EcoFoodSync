import { randomUUID } from 'crypto';
import { q } from '@/lib/db';
import { audit } from '@/lib/mongo';
import { requestSchema } from '@/lib/validate';
import { withAuth, json, readJson } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const GET = withAuth(null, async () => {
  const rows = await q(
    `SELECT fr.request_id, c.name AS charity_name,
            fr.food_type AS required_food_type,
            fr.quantity AS required_quantity,
            fr.urgency AS urgency_level,
            NULL AS request_time,
            fr.status
       FROM food_request fr
       JOIN charity_or_ngo c ON c.charity_id = fr.charity_id
      ORDER BY FIELD(fr.urgency, 'CRITICAL','HIGH','MEDIUM','LOW')
      LIMIT 200`
  );
  return json({ rows });
});

export const POST = withAuth(['ADMIN', 'CHARITY'], async (req, session) => {
  const d = requestSchema.parse(await readJson(req));
  const id = randomUUID();

  await q(
    `INSERT INTO food_request
       (request_id, charity_id, food_type, quantity, urgency, status)
     VALUES (?, ?, ?, ?, ?, 'OPEN')`,
    [id, d.charity_id, d.required_food_type, d.required_quantity, d.urgency_level]
  );

  await audit(session, 'CREATE', 'food_request', id, d);
  return json({ request_id: id }, 201);
});
