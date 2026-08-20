/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // next/image only optimizes whitelisted remote hosts.
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" }, // product images in Supabase Storage
      { protocol: "https", hostname: "storage.googleapis.com" }, // Spotify logo in Portfolio slide
    ],
  },
};

export default nextConfig;
