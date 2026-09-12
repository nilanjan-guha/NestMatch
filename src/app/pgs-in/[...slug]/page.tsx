import { Metadata } from 'next';
import connectToDatabase from '@/utils/db';
import { PGProperty } from '@/models/PGProperty';
import PGCard from '@/components/PGCard';
import Link from 'next/link';

export const revalidate = 86400; // Cache these dynamically generated pages for 24 hours (ISR)

type Props = {
  params: Promise<{ slug: string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  
  let title = 'Best PGs | Verified Accommodations | NestMatch';
  let description = 'Find the best paying guest accommodations. 100% Zero Brokerage and verified listings.';
  
  if (slug.length === 1) {
    const city = slug[0].charAt(0).toUpperCase() + slug[0].slice(1);
    title = `Best PGs in ${city} | Affordable & Verified | NestMatch`;
    description = `Find the best verified PGs and hostels in ${city}. 100% Zero Brokerage, AI-powered matching, and authentic reviews.`;
  } else if (slug.length === 2) {
    const city = slug[0].charAt(0).toUpperCase() + slug[0].slice(1);
    const locality = slug[1].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    title = `Best PGs in ${locality}, ${city} | Zero Brokerage | NestMatch`;
    description = `Looking for a PG in ${locality}, ${city}? Find affordable, verified paying guest accommodations with zero brokerage and great amenities.`;
  } else if (slug.length >= 3) {
    const city = slug[0].charAt(0).toUpperCase() + slug[0].slice(1);
    const locality = slug[1].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const type = slug.slice(2).join(' ').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    title = `${type} in ${locality}, ${city} | Verified | NestMatch`;
    description = `Find the best ${type} in ${locality}, ${city}. Affordable pricing, top amenities, and zero brokerage on NestMatch. Book today!`;
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
  };
}

export default async function ProgrammaticSeoPage({ params }: Props) {
  const { slug } = await params;
  
  await connectToDatabase();
  
  // Extract info from slug
  const cityParam = slug[0];
  const localityParam = slug.length > 1 ? slug[1].replace(/-/g, ' ') : '';
  const typeParam = slug.length > 2 ? slug.slice(2).join(' ').replace(/-/g, ' ') : '';
  
  // Build DB Query
  let query: any = {};
  
  // 1. City Matching (regex for case insensitivity)
  if (cityParam) {
    query['address.city'] = { $regex: new RegExp(cityParam, 'i') };
  }
  
  // 2. Locality Matching
  if (localityParam) {
    query['address.street'] = { $regex: new RegExp(localityParam, 'i') };
  }
  
  // 3. Type Matching (Boys PG, Girls PG, etc.)
  if (typeParam) {
    const lowerType = typeParam.toLowerCase();
    if (lowerType.includes('boys') || lowerType.includes('male') || lowerType.includes('gents')) {
      query['gender_type'] = { $in: ['Male', 'Unisex'] };
    } else if (lowerType.includes('girls') || lowerType.includes('female') || lowerType.includes('ladies')) {
      query['gender_type'] = { $in: ['Female', 'Unisex'] };
    }
    
    // Amenities
    const amenities = [];
    if (lowerType.includes('ac')) amenities.push({ $regex: /AC|Air Condition/i });
    if (lowerType.includes('wifi') || lowerType.includes('internet')) amenities.push({ $regex: /WiFi|Internet/i });
    if (lowerType.includes('food') || lowerType.includes('meals')) amenities.push({ $regex: /Food|Meals/i });
    
    if (amenities.length > 0) {
      query['amenities'] = { $all: amenities };
    }
  }

  // Fetch properties (limit to 50 for SEO landing pages to keep load time fast)
  const properties = await PGProperty.find(query).limit(50).lean();
  
  // Serialize for client components
  const serializedProperties = properties.map((p: any) => ({
    ...p,
    _id: p._id.toString(),
    owner_id: p.owner_id.toString(),
    createdAt: p.createdAt?.toISOString(),
    updatedAt: p.updatedAt?.toISOString(),
  }));
  
  const displayCity = cityParam.charAt(0).toUpperCase() + cityParam.slice(1);
  const displayLocality = localityParam ? localityParam.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : '';
  const displayType = typeParam ? typeParam.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : '';
  
  let pageHeading = `Properties in ${displayCity}`;
  if (displayLocality && displayType) {
    pageHeading = `${displayType} in ${displayLocality}, ${displayCity}`;
  } else if (displayLocality) {
    pageHeading = `PGs in ${displayLocality}, ${displayCity}`;
  } else if (displayType) {
    pageHeading = `${displayType} in ${displayCity}`;
  }

  // If no exact match, fallback to just the city (to show them *something* instead of a dead end)
  let fallbackProperties: any[] = [];
  if (serializedProperties.length === 0 && (localityParam || typeParam)) {
    const cityFallbackQuery = { 'address.city': { $regex: new RegExp(cityParam, 'i') } };
    const rawFallback = await PGProperty.find(cityFallbackQuery).limit(10).lean();
    fallbackProperties = rawFallback.map((p: any) => ({
      ...p,
      _id: p._id.toString(),
      owner_id: p.owner_id.toString(),
      createdAt: p.createdAt?.toISOString(),
      updatedAt: p.updatedAt?.toISOString(),
    }));
  }

  return (
    <main style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto', minHeight: '80vh' }}>
      {/* Navigation Breadcrumb */}
      <div style={{ marginBottom: '20px', fontSize: '14px', color: 'var(--text-muted)' }}>
        <Link href="/" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Home</Link> &gt;{' '}
        <Link href={`/pgs-in/${cityParam.toLowerCase()}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>{displayCity}</Link>
        {displayLocality && (
          <>
            {' '}&gt; <span style={{ color: 'var(--text-muted)' }}>{displayLocality}</span>
          </>
        )}
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '10px' }}>{pageHeading}</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          {serializedProperties.length > 0 
            ? `Found ${serializedProperties.length} verified ${serializedProperties.length === 1 ? 'property' : 'properties'} matching your criteria.`
            : `We couldn't find exact matches for ${pageHeading.toLowerCase()}, but check out these popular PGs in ${displayCity}.`
          }
        </p>
      </div>
      
      {serializedProperties.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '30px' }}>
          {serializedProperties.map((pg: any) => (
            <PGCard 
              key={pg._id} 
              pg={pg} 
              currentUserRole={null} 
              initialSaved={false}
            />
          ))}
        </div>
      ) : fallbackProperties.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '30px' }}>
          {fallbackProperties.map((pg: any) => (
            <PGCard 
              key={pg._id} 
              pg={pg} 
              currentUserRole={null} 
              initialSaved={false}
            />
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--surface-border)' }}>
          <span style={{ fontSize: '48px', display: 'block', marginBottom: '15px' }}>🔍</span>
          <h3 style={{ fontSize: '24px', color: 'var(--foreground)', marginBottom: '10px' }}>No properties found in {displayCity}</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto', marginBottom: '20px' }}>
            We are rapidly expanding our verified network. Check back soon or browse other nearby areas!
          </p>
          <Link href="/" style={{ padding: '12px 24px', background: 'linear-gradient(45deg, var(--primary), var(--secondary))', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold', display: 'inline-block' }}>
            Search Anywhere
          </Link>
        </div>
      )}
    </main>
  );
}
