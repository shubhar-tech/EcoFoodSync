import { withAuth, json } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const GET = withAuth(null, async (req, session) =>
  json({ user: { username: session.username, role: session.role } })
);
