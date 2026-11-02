import { pool } from '@/lib/db';
import { withAuth, json } from '@/lib/api';

export const dynamic = 'force-dynamic';

// Uses the stored procedure GetAvailableFoodByLocation
export const GET = withAuth(null, async (req) => {
  const location = (new URL(req.url).searchParams.get('location') || '').trim();
  if (location.length < 2 || location.length > 100) {
    return json({ error: 'location: enter 2-100 characters' }, 400);
  }
  const [result] = await pool.query('CALL GetAvailableFoodByLocation(?)', [location]);
  return json({ rows: result[0] });
});
