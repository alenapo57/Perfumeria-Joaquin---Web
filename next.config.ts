import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        // Cualquier proyecto de Supabase Storage (formato
        // https://<project-ref>.supabase.co/storage/v1/object/public/...)
        hostname: "**.supabase.co",
      },
    ],
  },
};

export default nextConfig;
