import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getSession } from '@/lib/auth';

export const json = (data, status = 200) => NextResponse.json(data, { status });

export async function readJson(req) {
  try {
    return await req.json();
  } catch {
    const e = new Error('Invalid JSON body');
    e.code = 'BAD_JSON';
    throw e;
  }
}

export function handleError(e) {
  if (e instanceof ZodError) {
    return json(
      { error: e.issues.map((i) => `${i.path.join('.') || 'input'}: ${i.message}`).join('; ') },
      400
    );
  }
  if (e?.code === 'BAD_JSON') return json({ error: e.message }, 400);
  // Errors raised by the database triggers (SIGNAL SQLSTATE '45000')
  if (e?.sqlState === '45000') return json({ error: e.sqlMessage }, 400);
  switch (e?.errno) {
    case 1062:
      return json({ error: 'A record with this unique value already exists' }, 409);
    case 3819:
      return json({ error: 'Value rejected by a database CHECK constraint' }, 400);
    case 1452:
      return json({ error: 'Referenced record does not exist' }, 400);
    case 1451:
      return json({ error: 'Record is still referenced by other records' }, 409);
    case 1265:
    case 1292:
    case 1366:
      return json({ error: 'Invalid value for a column' }, 400);
  }
  if (typeof e?.name === 'string' && e.name.startsWith('Mongo')) {
    return json({ error: 'MongoDB is unavailable. Check MONGODB_URI and that mongod is running.' }, 503);
  }
  console.error(e);
  return json({ error: 'Internal server error' }, 500);
}

// Wraps a route handler: authentication, role check, error mapping.
export function withAuth(roles, handler) {
  return async (req, ctx) => {
    const session = await getSession();
    if (!session) return json({ error: 'Not authenticated' }, 401);
    if (roles && !roles.includes(session.role)) {
      return json({ error: 'Your role is not allowed to do this' }, 403);
    }
    try {
      return await handler(req, session, ctx);
    } catch (e) {
      return handleError(e);
    }
  };
}
