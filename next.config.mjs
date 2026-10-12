import { createMDX } from 'fumadocs-mdx/next';

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
      },
      {
        protocol: "https",
        hostname: "r2.waitlyze.falakgala.dev",
        port: "",
      },
    ],
  },
  serverExternalPackages: ["geoip-lite", "better-auth"],
};

const withMDX = createMDX();

export default withMDX(nextConfig);
