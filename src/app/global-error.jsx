"use client";
import { StatusPage } from "@/components/product/status-page";

import "./globals.css";

export default function GlobalError({ retry }) {
  return (
    <html lang="en">
      <body>
        <StatusPage
          standalone
          code="500"
          title="Unable to load Waitlyze"
          description="Try loading the app again, or return home to continue."
          retry={retry}
        />
      </body>
    </html>
  );
}
