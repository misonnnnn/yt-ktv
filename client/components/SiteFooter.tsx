import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/contact";

export default function SiteFooter() {
  return (
    <footer className="px-6 py-8 text-center text-xs text-white/30">
      <p className="mb-2">
        <Link href="/" className="hover:text-white/50">
          TaraSing
        </Link>
        {" — "}
        free online karaoke for parties at home
      </p>
      <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <Link href="/terms" className="hover:text-white/50">
          Terms of Use
        </Link>
        <span aria-hidden="true">·</span>
        <Link href="/privacy" className="hover:text-white/50">
          Privacy Policy
        </Link>
        <span aria-hidden="true">·</span>
        <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-white/50">
          Contact
        </a>
      </p>
    </footer>
  );
}
