"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { recordPageView } from "@/lib/api";

// Survives React Strict Mode remounts so one navigation is not counted twice.
let lastRecordedPath = "";
let lastRecordedAt = 0;

function isCountablePath(path: string) {
  if (path === "/admin" || path.startsWith("/admin/")) return false;
  return true;
}

/** Fires once per in-app page load so admin can count visits. */
export default function PageVisitBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || !isCountablePath(pathname)) return;

    const now = Date.now();
    if (lastRecordedPath === pathname && now - lastRecordedAt < 2000) return;
    lastRecordedPath = pathname;
    lastRecordedAt = now;

    void recordPageView(pathname).catch(() => {
      // Stats should never break the page.
    });
  }, [pathname]);

  return null;
}
