import type { Metadata } from "next";

// Host screens are private parties — don't show them in Google
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function HostLayout({ children }: { children: React.ReactNode }) {
  return children;
}
