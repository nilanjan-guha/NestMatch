import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.nestmatch.co.in';

  // Define our core static routes
  const routes = [
    '',
    '/owner/add',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  // Define the matrix for Programmatic SEO (Massive list of Indian Cities)
  const topCities = [
    'bangalore', 'gurgaon', 'mumbai', 'pune', 'delhi', 'noida', 'hyderabad', 'chennai',
    'kolkata', 'ahmedabad', 'jaipur', 'surat', 'lucknow', 'kanpur', 'nagpur', 'indore',
    'chandigarh', 'bhopal', 'patna', 'vadodara', 'ghaziabad', 'ludhiana', 'agra', 
    'faridabad', 'kochi', 'dehradun', 'guwahati', 'bhubaneswar', 'mysore', 'coimbatore',
    'visakhapatnam', 'varanasi', 'aurangabad', 'amritsar', 'allahabad', 'ranchi', 
    'jabalpur', 'gwalior', 'jodhpur', 'madurai', 'raipur', 'kota', 'thiruvananthapuram',
    'gurugram', 'jalandhar', 'aligarh', 'bareilly', 'moradabad', 'tiruppur', 'guntur'
  ];

  const pgTypes = [
    '', // Just the city
    'boys-pg',
    'girls-pg',
    'coliving',
    'single-room',
    'luxury-pg'
  ];

  const seoRoutes = topCities.flatMap((city) => {
    return pgTypes.map((type) => {
      const slug = type ? `/pgs-in/${city}/${type}` : `/pgs-in/${city}`;
      return {
        url: `${baseUrl}${slug}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.9,
      };
    });
  });

  return [...routes, ...seoRoutes];
}
