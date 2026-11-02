import { q } from '@/lib/db';
import { audit } from '@/lib/mongo';
import { allocationStatusSchema } from '@/lib/validate';
import { withAuth, json, readJson } from '@/lib/api';

export const PATCH = withAuth(['ADMIN'], async (req, session, { params }) => {
  const { status } = allocationStatusSchema.parse(await readJson(req));
  const res = await q('UPDATE allocation SET status = ? WHERE allocation_id = ?', [status, params.id]);
  if (!res.affectedRows) return json({ error: 'Allocation not found' }, 404);
  await audit(session, 'UPDATE_STATUS', 'allocation', params.id, { status });
  return json({ ok: true });
});
