import { auth } from '@clerk/nextjs/server';
import { User } from '@/models/User';
import { redirect } from 'next/navigation';
import connectToDatabase from '@/utils/db';
import { SavedProperty } from '@/models/SavedProperty';
import WatchlistTable from '@/components/WatchlistTable';
import { PGProperty } from '@/models/PGProperty'; // Ensure model is loaded
import Link from 'next/link';

export default async function SavedPropertiesPage() {
  const { userId } = await auth();
    let session = null;
    if (userId) {
      session = { user: await User.findOne({ clerkId: userId }) };
    }
  
  if (!session || !session.user) {
    redirect('/login');
  }

  await connectToDatabase();
  
  // Ensure PGProperty model is registered before populating
  PGProperty.schema; 
  
  const saved = await SavedProperty.find({ user_id: (session.user as any)._id })
    .populate('property_id')
    .sort({ createdAt: -1 });

  const properties = saved.map(s => {
    if (s.property_id && typeof s.property_id === 'object' && (s.property_id as any).name) {
      return s.property_id;
    }
    return s.property_data;
  }).filter(Boolean);

  return (
    <main className="container" style={{ padding: '40px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', margin: 0 }}>My Watchlist</h1>
        <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '14px' }}>
          ← Back to Home
        </Link>
      </div>

      {properties.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '16px' }}>No Saved Properties</h2>
          <p style={{ color: 'var(--text-muted)' }}>Browse our listings and click the ❤️ icon to save properties here.</p>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '30px' }}>
          <WatchlistTable properties={JSON.parse(JSON.stringify(properties))} />
        </div>
      )}
    </main>
  );
}
