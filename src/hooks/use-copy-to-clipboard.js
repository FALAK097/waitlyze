"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useCopyToClipboard({ resetAfter = 2000 } = {}) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef(null);

  useEffect(
    () => () => {
      window.clearTimeout(resetTimer.current);
    },
    [],
  );

  const copy = useCallback(
    async (value) => {
      try {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        window.clearTimeout(resetTimer.current);
        resetTimer.current = window.setTimeout(() => setCopied(false), resetAfter);
        return true;
      } catch {
        return false;
      }
    },
    [resetAfter],
  );

  return { copied, copy };
}
