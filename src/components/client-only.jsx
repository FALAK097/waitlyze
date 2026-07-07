"use client";

import { useSyncExternalStore } from "react";

function subscribe() {
  return () => {};
}

export function ClientOnly({ children }) {
	const mounted = useSyncExternalStore(subscribe, () => true, () => false);

	if (!mounted) {
		return null;
	}

	return children;
}
