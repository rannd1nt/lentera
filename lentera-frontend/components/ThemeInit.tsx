"use client";

import { useEffect, useState } from "react";

export function ThemeInit({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "light-mode") {
      document.documentElement.setAttribute("data-theme", "light-mode");
    } else {
      document.documentElement.setAttribute("data-theme", "dark-mode");
    }
    setMounted(true);
  }, []);

  if (!mounted) return null;
  return <>{children}</>;
}
