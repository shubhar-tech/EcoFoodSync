import { cookies } from 'next/headers';
import { COOKIE, verifySession } from '@/lib/session';

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}
