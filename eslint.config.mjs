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
      globals: {
        // Node.js
        process: "readonly", console: "readonly", Buffer: "readonly", global: "readonly",
        __dirname: "readonly", __filename: "readonly", module: "readonly", require: "readonly", exports: "writable",
        setTimeout: "readonly", clearTimeout: "readonly", setInterval: "readonly", clearInterval: "readonly",
        setImmediate: "readonly", queueMicrotask: "readonly", structuredClone: "readonly",
        URL: "readonly", URLSearchParams: "readonly", fetch: "readonly", AbortController: "readonly", AbortSignal: "readonly",
        TextEncoder: "readonly", TextDecoder: "readonly", crypto: "readonly", performance: "readonly",
        Headers: "readonly", Request: "readonly", Response: "readonly", FormData: "readonly", Blob: "readonly",
        ReadableStream: "readonly", WritableStream: "readonly", TransformStream: "readonly",
        // Browser
        window: "readonly", document: "readonly", navigator: "readonly", location: "readonly", history: "readonly",
        localStorage: "readonly", sessionStorage: "readonly", screen: "readonly", alert: "readonly",
        requestAnimationFrame: "readonly", cancelAnimationFrame: "readonly", requestIdleCallback: "readonly",
        cancelIdleCallback: "readonly", matchMedia: "readonly", getComputedStyle: "readonly", scrollTo: "readonly",
        Event: "readonly", CustomEvent: "readonly", EventTarget: "readonly", Node: "readonly",
        HTMLElement: "readonly", HTMLInputElement: "readonly", HTMLButtonElement: "readonly", HTMLAnchorElement: "readonly",
        HTMLDivElement: "readonly", HTMLFormElement: "readonly", HTMLTableCellElement: "readonly", HTMLTableRowElement: "readonly",
        HTMLTableElement: "readonly", HTMLTextAreaElement: "readonly", HTMLSelectElement: "readonly", Element: "readonly",
        MutationObserver: "readonly", ResizeObserver: "readonly", IntersectionObserver: "readonly",
        WebSocket: "readonly", File: "readonly", FileReader: "readonly", Image: "readonly", FormDataEvent: "readonly",
        XMLHttpRequest: "readonly", Audio: "readonly",
        KeyboardEvent: "readonly", MouseEvent: "readonly", PointerEvent: "readonly", FocusEvent: "readonly",
        ClipboardEvent: "readonly", DragEvent: "readonly", TouchEvent: "readonly", UIEvent: "readonly",
        getSelection: "readonly", prompt: "readonly", confirm: "readonly",
        addEventListener: "readonly", removeEventListener: "readonly", dispatchEvent: "readonly",
        CSS: "readonly", DOMParser: "readonly", MutationRecord: "readonly", NodeFilter: "readonly",
        Intl: "readonly", Text: "readonly", atob: "readonly", btoa: "readonly",
      },
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
      "no-undef": "error",
    },
  },
  {
    files: ["src/components/product/**/*.{js,jsx}"],
    settings: { shadcn: { ui: "@/components/product", componentImports: ["^\\./(button|input|dialog)$"] } },
    rules: {
      "shadcn/no-arbitrary-values": "error",
      "shadcn/no-inline-styles": "error",
      "shadcn/no-restyle": ["error", { allow: ["layout"] }],
    },
  },
]);
