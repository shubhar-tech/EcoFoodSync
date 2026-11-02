import { mongoDb } from '@/lib/mongo';
import { withAuth, json } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const GET = withAuth(['ADMIN'], async () => {
  const db = await mongoDb();
  const logs = await db.collection('audit_logs').find({}).sort({ ts: -1 }).limit(100).toArray();
  return json({ logs });
});
