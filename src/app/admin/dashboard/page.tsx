export const dynamic = 'force-dynamic';
import { auth, currentUser } from '@clerk/nextjs/server';
import { User } from '@/models/User';
import { redirect } from 'next/navigation';
import connectToDatabase from '@/utils/db';
import { PGProperty } from '@/models/PGProperty';
import { BookingInterest } from '@/models/BookingInterest';
import Link from 'next/link';
import AdminPropertyTable from '@/components/AdminPropertyTable';
import AdminUserTable from '@/components/AdminUserTable';
import AdminOwnerTable from '@/components/AdminOwnerTable';

export default async function AdminDashboard() {
  const { userId } = await auth();
  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses[0]?.emailAddress;
  const phone = clerkUser?.phoneNumbers?.[0]?.phoneNumber;
  const isSuperAdmin = (email && email === process.env.ADMIN_EMAIL) || (phone && phone === process.env.ADMIN_PHONE);

  let session = null;
  if (userId) {
    await connectToDatabase();
    session = { user: await User.findOne({ clerkId: userId }) };
  }
  
  // If they are not Super Admin AND not a regular admin in the DB, kick them out
  if (!isSuperAdmin && (!session || (session.user as any)?.role !== 'admin')) {
    redirect('/'); 
  }

  await connectToDatabase();
  
  // Aggregate Metrics
  const totalUsers = await User.countDocuments();
  const totalOwners = await User.countDocuments({ role: 'owner' });
  const totalSearchers = await User.countDocuments({ role: 'searcher' });
  const totalProperties = await PGProperty.countDocuments();
  const totalBookings = await BookingInterest.countDocuments();

  // Fetch Lists
  const dbUsers = await User.find().sort({ createdAt: -1 }).lean();
  const properties = await PGProperty.find({}).populate('owner_id', 'name email phone').sort({ createdAt: -1 }).lean();
  
  // Flag super admin in the users array
  const users = dbUsers.map((u: any) => ({
    ...u,
    _id: u._id.toString(), // Fix React serialization issue for lean objects
    isSuperAdminUser: (u.email && u.email === process.env.ADMIN_EMAIL) || (u.phone && u.phone === process.env.ADMIN_PHONE)
  }));

  // Filter users
  const searchers = users.filter((u: any) => u.role === 'searcher');
  const owners = users.filter((u: any) => u.role === 'owner');

  return (
    <main className="container" style={{ padding: '40px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: 0, color: 'var(--primary)' }}>Admin Dashboard</h1>
        <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '14px' }}>
          ← Back to Site
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid-auto-fit" style={{ marginBottom: '40px' }}>
        <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
          <h3>Total Users</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--secondary)' }}>{totalUsers}</p>
          <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{totalOwners} Owners | {totalSearchers} Searchers</span>
        </div>
        <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
          <h3>Total PG Properties</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--secondary)' }}>{totalProperties}</p>
        </div>
        <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
          <h3>Total Bookings/Leads</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--secondary)' }}>{totalBookings}</p>
        </div>
      </div>

      {/* Users and Properties Layout */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        <div className="glass-panel" style={{ padding: '30px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Registered Searchers</h2>
          <AdminUserTable users={JSON.parse(JSON.stringify(searchers))} />
        </div>

        <div className="glass-panel" style={{ padding: '30px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Registered PG Owners</h2>
          <AdminOwnerTable owners={JSON.parse(JSON.stringify(owners))} properties={JSON.parse(JSON.stringify(properties))} />
        </div>

        {/* Global Properties */}
        <div className="glass-panel" style={{ padding: '30px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>All Listed Properties</h2>
          <AdminPropertyTable properties={JSON.parse(JSON.stringify(properties))} />
        </div>

      </div>
    </main>
  );
}
