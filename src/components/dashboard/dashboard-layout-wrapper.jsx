"use client";

import dynamic from "next/dynamic";

const DashboardLayout = dynamic(() => import("./dashboard-layout"), {
  ssr: false,
});

export default function DashboardLayoutWrapper({ children }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
