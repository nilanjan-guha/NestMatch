import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import connectToDatabase from '@/utils/db';
import { SavedProperty } from '@/models/SavedProperty';
import WatchlistTable from '@/components/WatchlistTable';
import { PGProperty } from '@/models/PGProperty'; // Ensure model is loaded

export default async function SavedPropertiesPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    redirect('/login');
  }

  await connectToDatabase();
  
  // Ensure PGProperty model is registered before populating
  PGProperty.schema; 
  
  const saved = await SavedProperty.find({ user_id: (session.user as any).id })
    .populate('property_id')
    .sort({ createdAt: -1 });

  // Filter out any where property_id is null (in case a property was deleted)
  const properties = saved.map(s => s.property_id).filter(Boolean);

  return (
    <main className="container" style={{ padding: '40px 24px' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '40px' }}>My Watchlist</h1>

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
