import { readFileSync } from "node:fs";

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import { createMDX } from "fumadocs-mdx/next";
import { parse } from "jsonc-parser";

const workerConfig = parse(readFileSync(new URL("./wrangler.jsonc", import.meta.url), "utf8"));
const workerVars = workerConfig.vars || {};

const publicClientEnv = {
  NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN:
    process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN || workerVars.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN,
  NEXT_PUBLIC_POSTHOG_HOST:
    process.env.NEXT_PUBLIC_POSTHOG_HOST || workerVars.NEXT_PUBLIC_POSTHOG_HOST,
  NEXT_PUBLIC_CHATGPT_PLUGIN_URL:
    process.env.NEXT_PUBLIC_CHATGPT_PLUGIN_URL || workerVars.NEXT_PUBLIC_CHATGPT_PLUGIN_URL || "",
  NEXT_PUBLIC_CLAUDE_CONNECTOR_URL:
    process.env.NEXT_PUBLIC_CLAUDE_CONNECTOR_URL ||
    workerVars.NEXT_PUBLIC_CLAUDE_CONNECTOR_URL ||
    "",
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Worker vars are runtime-only. Explicitly expose the public client values
  // while Next.js builds the browser bundle, using wrangler.jsonc as the source.
  env: publicClientEnv,
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
  // Better Auth's minimal entry point deliberately does not import Kysely, but
  // OpenNext bundles the complete external package. Keep its optional runtime
  // modules in the traced server output so that package bundling can resolve
  // every Better Auth export without putting Kysely on the request hot path.
  outputFileTracingIncludes: {
    "/*": ["node_modules/@better-auth/kysely-adapter/**/*", "node_modules/kysely/**/*"],
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
    "@prisma/adapter-d1",
    "@prisma/adapter-better-sqlite3",
    "better-sqlite3",
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
