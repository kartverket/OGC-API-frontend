/** @type {import('next').NextConfig} */
const nextConfig = {
    turbopack: {
        rules: {
            '*.svg': {
                loaders: ['@svgr/webpack'],
                as: '*.js',
            },
        },
    },
    images: {
        remotePatterns: [
            new URL('https://editor.geonorge.no/thumbnails/**')
        ]
    },
    output: 'standalone'
};

export default nextConfig;
