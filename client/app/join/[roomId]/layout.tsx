import type { Metadata } from "next";

// Live room pages are private — don't show them in Google
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function RoomLayout({ children }: { children: React.ReactNode }) {
  return children;
}
