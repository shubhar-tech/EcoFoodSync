import { q } from '@/lib/db';
import { audit } from '@/lib/mongo';
import { requestStatusSchema } from '@/lib/validate';
import { withAuth, json, readJson } from '@/lib/api';

export const PATCH = withAuth(['ADMIN', 'CHARITY'], async (req, session, { params }) => {
  const { id } = await params;
  const { status } = requestStatusSchema.parse(await readJson(req));

  const res = await q(
    'UPDATE food_request SET status = ? WHERE request_id = ?',
    [status, id]
  );

  if (!res.affectedRows) return json({ error: 'Request not found' }, 404);

  await audit(session, 'UPDATE_STATUS', 'food_request', id, { status });
  return json({ ok: true });
});
