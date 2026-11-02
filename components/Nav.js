'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '@/components/ui';

const LINKS = [
  ['/', 'Dashboard'],
  ['/donations', 'Donations'],
  ['/allocations', 'Allocations'],
  ['/deliveries', 'Deliveries'],
  ['/requests', 'Requests'],
  ['/directory', 'Directory'],
  ['/tracking', 'Tracking'],
  ['/audit', 'Audit log', 'ADMIN'],
];

export default function Nav({ user }) {
  const path = usePathname();
  const router = useRouter();

  async function logout() {
    await api('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="nav">
      <div className="brand">🌱 EcoFoodSync</div>
      <nav>
        {LINKS.filter(([, , role]) => !role || role === user.role).map(([href, label]) => (
          <Link key={href} href={href} className={path === href ? 'active' : ''}>
            {label}
          </Link>
        ))}
      </nav>
      <div className="who">
        <span>
          {user.username} <small>({user.role})</small>
        </span>
        <button onClick={logout}>Log out</button>
      </div>
    </header>
  );
}
