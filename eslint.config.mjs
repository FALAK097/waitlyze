import { plugin as shadcn } from "@shadcn/lint";
import tsParser from "@typescript-eslint/parser";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    ignores: [".next/**", "node_modules/**", "src/generated/**", "coverage/**", "playwright-report/**", "test-results/**"],
  },
  {
    files: ["**/*.{js,jsx,mjs,ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { shadcn },
    // Start with correctness checks that do not impose a new legacy UI policy.
    // Design contracts belong to the foundation slice after tokens exist.
    rules: {
      "no-debugger": "error",
      "no-dupe-args": "error",
      "no-dupe-keys": "error",
      "no-duplicate-case": "error",
      "no-invalid-regexp": "error",
      "no-unreachable": "error",
      "no-unsafe-finally": "error",
    },
  },
  {
    files: ["src/components/product/**/*.{js,jsx}", "tests/fixtures/foundation/**/*.jsx"],
    settings: { shadcn: { ui: "@/components/product", componentImports: ["^\\./(button|input|dialog)$"], note: "See docs/REVAMP_FOUNDATION.md." } },
    rules: {
      "shadcn/no-arbitrary-values": "error",
      "shadcn/no-inline-styles": "error",
      "shadcn/no-restyle": ["error", { allow: ["layout"] }],
    },
  },
]);
