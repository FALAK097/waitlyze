"use client";

import dynamic from "next/dynamic";

const Header = dynamic(() => import("./header"), {
  ssr: false,
});

export default function HeaderWrapper() {
  return <Header />;
}
