"use client";

import { useEffect, useState } from "react";

export default function CopyrightYear({ initialYear }) {
  const [year, setYear] = useState(initialYear);
  useEffect(() => {
    let timer;
    function update() {
      clearTimeout(timer);
      const now = new Date();
      setYear(now.getFullYear());
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      timer = setTimeout(update, midnight.getTime() - now.getTime() + 100);
    }
    update();
    document.addEventListener("visibilitychange", update);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  return year;
}
