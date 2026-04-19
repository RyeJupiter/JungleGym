import type { MetadataRoute } from 'next'

export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/auth/',
          '/studio/',
          '/settings',
          '/admin',
          '/library',
          '/dashboard',
          '/welcome',
          '/apply',
          '/video/*/checkout',
        ],
      },
    ],
    sitemap: 'https://junglegym.academy/sitemap.xml',
    host: 'https://junglegym.academy',
  }
}
