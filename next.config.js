/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: 'frame-ancestors https://jackyjoh.com http://localhost:3000 http://localhost',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
