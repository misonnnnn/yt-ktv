"use client";

import { useEffect } from "react";
import { recordHomepageView } from "@/lib/api";

// Prevents double-count in React Strict Mode (dev mounts effects twice).
let recordedThisPageLoad = false;

/** Fires once per homepage load so admin can count visits. */
export default function HomeVisitBeacon() {
  useEffect(() => {
    if (recordedThisPageLoad) return;
    recordedThisPageLoad = true;

    void recordHomepageView().catch(() => {
      // Stats should never break the homepage.
    });
  }, []);

  return null;
}
