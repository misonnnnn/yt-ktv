import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { CONTACT_EMAIL } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How TaraSing handles information when you use our karaoke service and YouTube API Services.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>Last updated: September 30, 2026</p>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white sm:text-xl">1. Overview</h2>
        <p>
          This Privacy Policy explains what information TaraSing accesses,
          collects, stores, and uses when you use our free online karaoke
          service.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white sm:text-xl">
          2. YouTube API Services
        </h2>
        <p>
          TaraSing uses YouTube API Services to search for karaoke videos and to
          play them with the YouTube embedded player. By using TaraSing, you
          also acknowledge Google&apos;s privacy practices. See the{" "}
          <a
            href="https://www.google.com/policies/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-300 underline hover:text-purple-200"
          >
            Google Privacy Policy
          </a>
          .
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white sm:text-xl">
          3. Information we access, collect, and store
        </h2>
        <p>Depending on how you use TaraSing, we may process:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <span className="text-white/80">Party details</span> — party name,
            host name, and room/party code needed to create and join a karaoke
            room.
          </li>
          <li>
            <span className="text-white/80">Guest / singer names</span> — display
            names you enter when joining or adding a song.
          </li>
          <li>
            <span className="text-white/80">Song queue data</span> — YouTube
            video IDs, video titles, channel names, thumbnails, and queue status
            so the party can play songs in order.
          </li>
          <li>
            <span className="text-white/80">Technical logs</span> — basic server
            error logs used to keep the service running. We do not run separate
            analytics products in the TaraSing app.
          </li>
        </ul>
        <p>
          We do not require user accounts or passwords. We do not intentionally
          collect payment information.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white sm:text-xl">
          4. How we use and process information
        </h2>
        <p>We use this information to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Create and operate karaoke parties and song queues</li>
          <li>Search YouTube and play selected videos for the party</li>
          <li>Sync playback between host and guest devices when that feature is enabled</li>
          <li>Fix errors and keep the service available</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white sm:text-xl">
          5. Sharing and third parties
        </h2>
        <p>
          We share information only as needed to run TaraSing:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <span className="text-white/80">YouTube / Google</span> — search
            queries and video playback go through YouTube API Services and the
            YouTube player. Google may process data under its own policies.
          </li>
          <li>
            <span className="text-white/80">Hosting and database providers</span>{" "}
            — party and queue data may be stored on the servers and database used
            to operate TaraSing.
          </li>
        </ul>
        <p>
          We do not sell your personal information. Party members in the same
          room can see shared queue and singer information for that party.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white sm:text-xl">
          6. Cookies and device storage
        </h2>
        <p>
          TaraSing itself does not use first-party cookies or browser
          localStorage/sessionStorage to track you. The embedded YouTube player
          and YouTube/Google services may set cookies or use similar technologies
          on your device as described in the{" "}
          <a
            href="https://www.google.com/policies/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-300 underline hover:text-purple-200"
          >
            Google Privacy Policy
          </a>
          . Your browser may also keep ordinary temporary data needed to load
          the website.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white sm:text-xl">
          7. Retention of YouTube API data
        </h2>
        <p>
          YouTube video identifiers and related metadata used for the party queue
          are kept only as needed to run the party. Finished queue items are
          removed when a song ends or is skipped. We also delete stored YouTube
          queue data that is older than 30 days.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white sm:text-xl">8. Contact</h2>
        <p>
          Privacy questions or requests:{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-purple-300 underline hover:text-purple-200"
          >
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </section>
    </LegalPage>
  );
}
