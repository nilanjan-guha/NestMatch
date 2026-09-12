import { MetadataRoute } from 'next';
import topCities from '@/data/indian-cities.json';

const baseUrl = 'https://www.nestmatch.co.in';

const pgTypes = [
  '',
  'boys-pg',
  'girls-pg',
  'coliving',
  'single-room',
  'luxury-pg',
  'student-hostel',
  'working-professionals-pg',
  'ac-pg',
  'non-ac-pg',
  'pg-with-food',
  'pg-without-food',
  'cheap-pg',
  'affordable-pg',
  'premium-pg',
  'pg-near-me',
  'double-sharing-pg',
  'triple-sharing-pg',
  'four-sharing-pg',
  'furnished-pg',
  'semi-furnished-pg',
  'unfurnished-pg',
  'mens-hostel',
  'womens-hostel',
  'executive-pg',
  'pg-for-students',
  'pg-for-couples',
  'independent-room',
  'pg-with-attached-bathroom',
  'pg-with-wifi',
  'pg-without-brokerage',
  'zero-brokerage-pg',
  'best-pg',
  'top-pg'
];

const MAX_URLS_PER_SITEMAP = 40000; // Stay below Google's 50k limit

export async function generateSitemaps() {
  const totalCombinations = topCities.length * pgTypes.length;
  const numberOfSitemaps = Math.ceil(totalCombinations / MAX_URLS_PER_SITEMAP);
  
  const sitemaps = [];
  // Ensure we always have at least 1 sitemap
  for (let i = 0; i < Math.max(1, numberOfSitemaps); i++) {
    sitemaps.push({ id: i });
  }
  
  return sitemaps;
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = id === 0 ? [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/owner/add`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    }
  ] : [];

  const startIdx = id * MAX_URLS_PER_SITEMAP;
  const endIdx = startIdx + MAX_URLS_PER_SITEMAP;
  const totalCombinations = topCities.length * pgTypes.length;
  
  const sitemapUrls: MetadataRoute.Sitemap = [];
  
  for (let i = startIdx; i < Math.min(endIdx, totalCombinations); i++) {
    const cityIdx = Math.floor(i / pgTypes.length);
    const typeIdx = i % pgTypes.length;
    
    const city = topCities[cityIdx];
    const type = pgTypes[typeIdx];
    
    const slug = type ? `/pgs-in/${city}/${type}` : `/pgs-in/${city}`;
    sitemapUrls.push({
      url: `${baseUrl}${slug}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    });
  }
  
  return [...staticRoutes, ...sitemapUrls];
}
