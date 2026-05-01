/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'asanisdatapublicprd01.blob.core.windows.net' },
      { protocol: 'https', hostname: 'matchcenter.al-la.ch' },
    ],
  },
}
module.exports = nextConfig
