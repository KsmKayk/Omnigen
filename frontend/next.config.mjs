/** @type {import('next').NextConfig} */
const config = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
      {
        source: '/output/:path*',
        destination: 'http://localhost:3001/output/:path*',
      },
    ]
  },
}

export default config
