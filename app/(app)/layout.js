import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import Nav from '@/components/Nav';

export default async function AppLayout({ children }) {
  const session = await getSession();
  if (!session) redirect('/login');
  return (
    <>
      <Nav user={{ username: session.username, role: session.role }} />
      <main className="container">{children}</main>
    </>
  );
}
