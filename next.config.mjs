import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import { createMDX } from "fumadocs-mdx/next";

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "5mb" },
    optimizePackageImports: [
      "@hugeicons/core-free-icons",
      "@hugeicons/react",
      "date-fns",
      "recharts",
      "echarts",
      "lucide-react",
    ],
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
        hostname: "r2.waitlyze.com",
        port: "",
      },
    ],
  },
  serverExternalPackages: ["@prisma/client", ".prisma/client", "better-auth", "prisma"],
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
