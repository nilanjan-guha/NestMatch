import { PGProperty } from '@/models/PGProperty';
import connectToDatabase from '@/utils/db';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import PGDetailsClient from './PGDetailsClient'; // We'll move the client part here to avoid Next.js error

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  await connectToDatabase();
  const pg = await PGProperty.findById(id).lean();

  if (!pg) {
    return {
      title: 'PG Not Found - NestMatch',
      description: 'The requested PG could not be found.'
    };
  }

  return {
    title: `${pg.name} | PG in ${pg.address?.city || 'India'} - NestMatch`,
    description: `Rent ${pg.name} in ${pg.address?.city}. ${pg.gender_type} PG with ${pg.capacity?.available_beds || 'available'} beds. ${pg.description?.substring(0, 100)}...`,
    openGraph: {
      title: `${pg.name} | NestMatch`,
      description: pg.description || 'Find your perfect PG on NestMatch.',
      images: pg.media && pg.media.length > 0 ? [pg.media[0]] : []
    }
  };
}

export default async function PGPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  await connectToDatabase();
  const pg = await PGProperty.findById(id).lean();

  if (!pg) {
    return notFound();
  }

  // Parse to avoid hydration issues with MongoDB ObjectIds
  const safePg = JSON.parse(JSON.stringify(pg));

  return (
    <main className="container" style={{ padding: '120px 24px 40px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ background: 'var(--surface)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--surface-border)' }}>
        <div style={{ position: 'relative' }}>
          <PGDetailsClient pg={safePg} />
        </div>
      </div>
    </main>
  );
}
