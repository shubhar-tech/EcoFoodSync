import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { audit } from '@/lib/mongo';
import { signSession, COOKIE } from '@/lib/session';
import { signupSchema } from '@/lib/validate';
import { handleError, readJson } from '@/lib/api';

export async function POST(req) {
  try {
    const data = signupSchema.parse(await readJson(req));
    const hash = await bcrypt.hash(data.password, 12);
    const userId = randomUUID();
    await q(
      'INSERT INTO app_user (user_id, username, email, password_hash, role) VALUES (?,?,?,?,?)',
      [userId, data.username, data.email, hash, data.role]
    );
    const session = { uid: userId, username: data.username, role: data.role };
    const res = NextResponse.json({ user: { username: data.username, role: data.role } }, { status: 201 });
    res.cookies.set(COOKIE, await signSession(session), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 8 * 3600,
    });
    await audit(session, 'REGISTER', 'app_user', userId);
    return res;
  } catch (e) {
    if (e?.errno === 1062) {
      return NextResponse.json({ error: 'Username or email already registered' }, { status: 409 });
    }
    return handleError(e);
  }
}
