import { readFileSync } from "node:fs";

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import { createMDX } from "fumadocs-mdx/next";
import { parse } from "jsonc-parser";

const workerConfig = parse(readFileSync(new URL("./wrangler.jsonc", import.meta.url), "utf8"));
const workerVars = workerConfig.vars || {};

const publicAnalyticsEnv = {
  NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN:
    process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN || workerVars.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN,
  NEXT_PUBLIC_POSTHOG_HOST:
    process.env.NEXT_PUBLIC_POSTHOG_HOST || workerVars.NEXT_PUBLIC_POSTHOG_HOST,
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Worker vars are runtime-only. Explicitly expose the public analytics values
  // while Next.js builds the browser bundle, using wrangler.jsonc as the source.
  env: publicAnalyticsEnv,
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
  outputFileTracingExcludes: {
    "*": [
      "node_modules/prisma/**",
      "node_modules/@prisma/engines/**",
      "node_modules/@prisma/engines-version/**",
      "node_modules/wrangler/**",
      "node_modules/@opennextjs/**",
      "node_modules/workerd/**",
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
  serverExternalPackages: [
    "@prisma/client",
    ".prisma/client",
    "@prisma/adapter-neon",
    "@neondatabase/serverless",
    "better-auth",
  ],
  async redirects() {
    return [
      {
        source: "/docs/api",
        destination: "/docs/api/reference",
        permanent: true,
      },
      {
        source: "/wait-lists/:path*",
        destination: "/waitlists/:path*",
        permanent: true,
      },
      {
        source: "/changelog",
        destination: "/docs/changelog",
        permanent: true,
      },
      {
        source: "/docs/notifications",
        destination: "/docs/slack",
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
