import Link from 'next/link';
import { auth, currentUser } from '@clerk/nextjs/server';
import { UserButton, SignInButton, SignUpButton } from '@clerk/nextjs';
import { User } from '@/models/User';
import ThemeToggle from './ThemeToggle';
import connectToDatabase from '@/utils/db';
import { PGProperty } from '@/models/PGProperty';
import { SavedProperty } from '@/models/SavedProperty';
import OnboardingRedirect from './OnboardingRedirect';

export default async function Navbar() {
  const { userId } = await auth();
  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses[0]?.emailAddress;
  const phone = clerkUser?.phoneNumbers?.[0]?.phoneNumber;

  // Check if this user is the Super Admin defined in .env
  const isSuperAdmin = (email && email === process.env.ADMIN_EMAIL) || (phone && phone === process.env.ADMIN_PHONE);

  let session = null;
  let dbUser = null;
  if (userId) {
    await connectToDatabase();
    dbUser = await User.findOne({ clerkId: userId });

    // Auto-link legacy accounts that don't have a clerkId yet or handle bypassed onboarding
    if (!dbUser && email) {
      const isConfigAdmin = email === process.env.ADMIN_EMAIL;
      const userPhone = phone || (isConfigAdmin ? process.env.ADMIN_PHONE : '');

      // Use returnDocument: 'after' to fix Mongoose warning, and add upsert: true
      dbUser = await User.findOneAndUpdate(
        { email },
        {
          clerkId: userId,
          name: clerkUser?.firstName || email.split('@')[0],
          email: email,
          ...(userPhone && { phone: userPhone }),
          ...(isConfigAdmin && { role: 'admin', onboarded: true })
        },
        { returnDocument: 'after', upsert: true }
      );
    }

    if (dbUser) {
      session = { user: dbUser };
    }
  }

  const role = (session?.user as any)?.role;

  let hasProperties = false;
  let hasSavedProperties = false;

  if (session && !isSuperAdmin) {
    await connectToDatabase();

    // Check if the current user has created any properties (Only needed for owners)
    if (role === 'owner') {
      const propertyCount = await PGProperty.countDocuments({
        owner_id: (session.user as any)._id
      });
      hasProperties = propertyCount > 0;
    }

    // Check if the current user has saved any properties (Both Searcher and Owner can use Watchlist)
    const savedCount = await SavedProperty.countDocuments({
      user_id: (session.user as any)._id
    });
    hasSavedProperties = savedCount > 0;
  }

  return (
    <>
      {userId && dbUser && !dbUser.onboarded && !isSuperAdmin && <OnboardingRedirect />}
      <nav style={{ padding: '20px 24px', borderBottom: '1px solid var(--surface-border)', background: 'var(--background-transparent)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ fontSize: '24px', fontWeight: 'bold', textDecoration: 'none', color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          NestMatch
        </Link>

        {/* Checkbox Hack for Mobile Menu */}
        <input type="checkbox" id="mobile-menu-toggle" style={{ display: 'none' }} />
        <label htmlFor="mobile-menu-toggle" className="mobile-menu-btn">
          ☰
        </label>

        <div className="mobile-menu-content" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          {userId ? (
            <>
              {/* Navigation Links Group */}
              <div className="stack-mobile" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Link href="/saved" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40px', padding: '0 16px', color: 'var(--foreground)', textDecoration: 'none', fontWeight: '500', borderRadius: '8px', background: 'var(--surface)', width: '100%', whiteSpace: 'nowrap' }}>
                  Watchlist ❤️
                </Link>

                {(isSuperAdmin || dbUser?.onboarded) && (
                  <>
                    {(!isSuperAdmin && role === 'owner') && (
                      hasProperties ? (
                        <Link href="/owner/dashboard" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40px', padding: '0 16px', color: 'var(--foreground)', textDecoration: 'none', fontWeight: '500', borderRadius: '8px', background: 'var(--surface)', width: '100%', whiteSpace: 'nowrap' }}>
                          Check my PG
                        </Link>
                      ) : (
                        <Link href="/owner/add" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40px', padding: '0 16px', background: 'linear-gradient(45deg, var(--primary), var(--secondary))', borderRadius: '8px', color: 'white', textDecoration: 'none', fontWeight: '500', width: '100%', whiteSpace: 'nowrap' }}>
                          List your PG
                        </Link>
                      )
                    )}

                    {(isSuperAdmin || role === 'admin') && (
                      <Link href="/admin/dashboard" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40px', padding: '0 16px', color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold', borderRadius: '8px', background: 'var(--surface)', width: '100%', whiteSpace: 'nowrap' }}>
                        Admin Dashboard
                      </Link>
                    )}
                  </>
                )}
              </div>

              {/* Divider */}
              <div className="hide-mobile" style={{ width: '1px', height: '24px', background: 'var(--surface-border)' }}></div>

              {/* User Profile & Theme Group */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '10px 0' }}>
                <ThemeToggle />
                <span style={{ color: 'var(--text-muted)', fontSize: '14px', whiteSpace: 'nowrap' }}>
                  Hello, <strong style={{ color: 'var(--foreground)' }}>{clerkUser?.firstName || email?.split('@')[0]}</strong>
                </span>
                <UserButton />
              </div>
            </>
          ) : (
            <div className="stack-mobile" style={{ display: 'flex', alignItems: 'center', gap: '15px', width: '100%' }}>
              <ThemeToggle />
              <div className="hide-mobile" style={{ width: '1px', height: '24px', background: 'var(--surface-border)' }}></div>
              <SignInButton mode="modal">
                <button style={{ height: '40px', padding: '0 20px', color: 'var(--foreground)', background: 'var(--surface)', border: '1px solid var(--surface-border)', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer', width: '100%' }}>
                  Login
                </button>
              </SignInButton>
              <SignUpButton mode="modal" fallbackRedirectUrl="/onboarding">
                <button style={{ height: '40px', padding: '0 20px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer', width: '100%' }}>
                  Register
                </button>
              </SignUpButton>
            </div>
          )}
        </div>
      </div>
    </nav>
    </>
  );
}
