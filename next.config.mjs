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

export default nextConfig;
