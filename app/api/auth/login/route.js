import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { audit } from '@/lib/mongo';
import { signSession, COOKIE } from '@/lib/session';
import { loginSchema } from '@/lib/validate';
import { handleError, readJson } from '@/lib/api';

export async function POST(req) {
  try {
    const { username, password } = loginSchema.parse(await readJson(req));
    const rows = await q(
      'SELECT user_id, username, password_hash, role FROM app_user WHERE username = ? LIMIT 1',
      [username]
    );
    const user = rows[0];
    const ok = user ? await bcrypt.compare(password, user.password_hash) : false;
    if (!ok) {
      await audit({ username }, 'LOGIN_FAILED', 'app_user', null);
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }
    const session = { uid: user.user_id, username: user.username, role: user.role };
    const res = NextResponse.json({ user: { username: user.username, role: user.role } });
    res.cookies.set(COOKIE, await signSession(session), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 8 * 3600,
    });
    await audit(session, 'LOGIN', 'app_user', user.user_id);
    return res;
  } catch (e) {
    return handleError(e);
  }
}
