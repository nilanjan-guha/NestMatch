import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import ThemeToggle from './ThemeToggle';
import connectToDatabase from '@/utils/db';
import { PGProperty } from '@/models/PGProperty';

export default async function Navbar() {
  const session = await getServerSession(authOptions);

  let hasProperties = false;
  if (session && (session.user as any)?.role === 'owner') {
    await connectToDatabase();
    const count = await PGProperty.countDocuments({ owner_id: (session.user as any).id });
    hasProperties = count > 0;
  }

  return (
    <nav style={{ padding: '20px 24px', borderBottom: '1px solid var(--surface-border)', background: 'var(--background-transparent)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100 }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ fontSize: '24px', fontWeight: 'bold', textDecoration: 'none', color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          NestMatch
        </Link>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <ThemeToggle />
          {session ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '14px', whiteSpace: 'nowrap' }}>
                Hello, {session.user?.name}
              </span>
              {(session.user as any)?.role === 'searcher' && (
                <Link href="/saved" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40px', padding: '0 16px', color: 'var(--foreground)', textDecoration: 'none', fontWeight: 'bold', borderRadius: '8px' }}>
                  Watchlist ❤️
                </Link>
              )}
              {(session.user as any)?.role === 'owner' && (
                hasProperties ? (
                  <Link href="/owner/dashboard" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40px', padding: '0 16px', color: 'var(--foreground)', textDecoration: 'none', fontWeight: 'bold', borderRadius: '8px' }}>
                    Dashboard
                  </Link>
                ) : (
                  <Link href="/owner/add" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40px', padding: '0 16px', background: 'linear-gradient(45deg, var(--primary), var(--secondary))', borderRadius: '8px', color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>
                    Create your PG
                  </Link>
                )
              )}
              {(session.user as any)?.role === 'admin' && (
                <Link href="/admin/dashboard" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40px', padding: '0 16px', color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold', borderRadius: '8px' }}>
                  Admin Dashboard ⚡
                </Link>
              )}
              <Link href="/api/auth/signout" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40px', padding: '0 16px', background: 'var(--surface)', borderRadius: '8px', color: 'var(--foreground)', textDecoration: 'none', border: '1px solid var(--surface-border)', fontSize: '14px', fontWeight: '500' }}>
                Logout
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <Link href="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40px', padding: '0 16px', color: 'var(--foreground)', textDecoration: 'none', fontWeight: 'bold', borderRadius: '8px' }}>
                Login
              </Link>
              <Link href="/register" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40px', padding: '0 16px', background: 'linear-gradient(45deg, var(--primary), var(--secondary))', borderRadius: '8px', color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>
                Create Account
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
