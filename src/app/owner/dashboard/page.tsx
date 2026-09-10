export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import connectToDatabase from '@/utils/db';
import { PGProperty } from '@/models/PGProperty';
import { BookingInterest } from '@/models/BookingInterest';
import { User } from '@/models/User';
import PropertyTable from '@/components/PropertyTable';
import BookingStatusUpdater from '@/components/BookingStatusUpdater';

export default async function OwnerDashboard() {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user as any)?.role !== 'owner') {
    redirect('/login');
  }

  await connectToDatabase();
  const properties = await PGProperty.find({ owner_id: (session.user as any).id }).sort({ createdAt: -1 });

  // Ensure models are registered for population
  User.schema;
  PGProperty.schema;
  
  const interests = await BookingInterest.find({ owner_id: (session.user as any).id })
    .populate('searcher_id', 'name email phone')
    .populate('property_id', 'name')
    .sort({ createdAt: -1 });

  return (
    <main className="container" style={{ padding: '40px 24px' }}>
      
      {/* Analytics Section */}
      <div className="glass-panel" style={{ padding: '30px', marginBottom: '40px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '20px', color: 'var(--primary)' }}>Lead Analytics & Interests</h2>
        {interests.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No bookings or interests yet. Make sure your properties are well-detailed!</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--surface-border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px' }}>Date</th>
                  <th style={{ padding: '12px' }}>Property</th>
                  <th style={{ padding: '12px' }}>Searcher Name</th>
                  <th style={{ padding: '12px' }}>Contact Info</th>
                  <th style={{ padding: '12px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {interests.map((interest: any) => (
                  <tr key={interest._id.toString()} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px' }}>{new Date(interest.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{interest.property_id?.name}</td>
                    <td style={{ padding: '12px' }}>{interest.searcher_id?.name}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ marginBottom: '4px' }}>
                        <a href={`mailto:${interest.searcher_id?.email}`} style={{ color: 'var(--secondary)', textDecoration: 'none' }}>
                          {interest.searcher_id?.email}
                        </a>
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        📞 {interest.searcher_id?.phone || 'No phone provided'}
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <BookingStatusUpdater bookingId={interest._id.toString()} currentStatus={interest.status || 'Pending'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px' }}>My Properties</h1>
        <Link href="/owner/add" style={{ padding: '12px 24px', background: 'linear-gradient(45deg, var(--primary), var(--secondary))', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>
          + List New Property
        </Link>
      </div>

      {properties.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '16px' }}>No Properties Listed Yet</h2>
          <p style={{ color: 'var(--text-muted)' }}>Start by adding your first PG to NestMatch.</p>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '30px' }}>
          <PropertyTable properties={JSON.parse(JSON.stringify(properties))} />
        </div>
      )}
    </main>
  );
}
