import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.dkpp.info';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/forecast', '/entry', '/verify'],
        disallow: [
          '/api/',
          '/admin/',
          '/_next/',
          '/*.xlsx$',
          '/*.docx$',
          '/*.kmz$',
          '/*.json$',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: ['/', '/forecast', '/entry', '/verify'],
        disallow: [
          '/api/',
          '/admin/',
          '/*.xlsx$',
          '/*.docx$',
          '/*.kmz$',
          '/*.json$',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
