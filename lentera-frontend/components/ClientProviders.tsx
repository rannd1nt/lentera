"use client";

import { ToastProvider } from "@/components/ui/Toast";
import { ThemeInit } from "@/components/ThemeInit";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeInit>
      <ToastProvider>{children}</ToastProvider>
    </ThemeInit>
  );
}
