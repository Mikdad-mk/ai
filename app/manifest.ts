import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'AI Ustad',
        short_name: 'AI Ustad',
        description: 'Your Intelligent Islamic Scholar powered by Ahlussunnah methodology.',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#d97706',
        icons: [
            {
                src: 'https://res.cloudinary.com/dqliogfsg/image/upload/v1764522883/AI_USTAD-01_fsgefv.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: 'https://res.cloudinary.com/dqliogfsg/image/upload/v1764522883/AI_USTAD-01_fsgefv.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    }
}
