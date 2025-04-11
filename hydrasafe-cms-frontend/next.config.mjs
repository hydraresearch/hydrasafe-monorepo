/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; img-src 'self' data:; font-src 'self' fonts.gstatic.com localhost; connect-src 'self' http://localhost:5000 http://localhost:5000/api http://localhost:5000/api/*;"
          }
        ]
      }
    ]
  }
};

export default nextConfig;