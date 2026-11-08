import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import { createMDX } from "fumadocs-mdx/next";

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "5mb" },
  },
  images: {
    // Workers don't provide the Next.js sharp optimizer. Serve source images
    // directly; the Cloudflare CDN can cache them at the edge.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
      },
      {
        protocol: "https",
        hostname: "assets.waitlyze.com",
        port: "",
      },
      {
        protocol: "https",
        // Existing user-created pages can still reference the former R2 host.
        hostname: "r2.waitlyze.falakgala.dev",
        port: "",
      },
    ],
  },
  serverExternalPackages: ["@prisma/client", ".prisma/client", "better-auth"],
  async redirects() {
    return [
      {
        source: "/wait-lists/:path*",
        destination: "/waitlists/:path*",
        permanent: true,
      },
      {
        source: "/dashboard/:path*",
        destination: "/waitlists/:path*",
        permanent: true,
      },
    ];
  },
};

const withMDX = createMDX();

export default withMDX(nextConfig);

initOpenNextCloudflareForDev();
