import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/api/', '/chat/'],
        },
        sitemap: 'https://usthad.ai/sitemap.xml',
    }
}
