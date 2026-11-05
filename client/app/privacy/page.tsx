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
      <p>Last updated: November 5, 2026</p>

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
            <span className="text-white/80">Optional account</span> — if you
            create one: display name, email, a password hash (never the
            password itself), an optional profile picture link, and Google&apos;s
            account id when you use Sign in with Google. Karaoke does not
            require an account.
          </li>
          <li>
            <span className="text-white/80">Your library</span> — favorites,
            playlists, song requests you submit while signed in, and parties you
            host or join. We store the YouTube video id you chose, plus a short
            cache of the title, channel name, and thumbnail address.
          </li>
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
          Accounts are optional. Guests can create parties, join with a QR code,
          search songs, and add them to the queue without registering. We do not
          intentionally collect payment information.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white sm:text-xl">
          4. How we use and process information
        </h2>
        <p>We use this information to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Create and operate karaoke parties and song queues</li>
          <li>Keep an optional account, favorites, and playlists when you ask us to</li>
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
          Signed-in accounts use an httpOnly session cookie so the API can tell
          who you are. Logging out, or deleting your account, clears that
          cookie. It does not close a karaoke party that is already running.
          When a guest adds a song, that browser can also keep a short history
          in localStorage (video id, title, channel, and thumbnail) so they can
          see songs they picked on this device. That history stays on the
          device and is separate from an account. The embedded YouTube player
          and YouTube/Google services may set cookies or use similar
          technologies on your device as described in the{" "}
          <a
            href="https://www.google.com/policies/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-300 underline hover:text-purple-200"
          >
            Google Privacy Policy
          </a>
          . Sign in with Google uses Google Identity Services to confirm your
          email. TaraSing does not request YouTube account permissions.
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
          queue data that is older than 30 days. Cached titles, channel names,
          and thumbnail addresses on favorites, playlists, and your request
          history are refreshed or removed within 30 days. The video id you
          saved stays until you remove that song or delete your account.
        </p>
        <p>
          If you delete your TaraSing account, we delete the account and the
          personal data tied to it (profile, sessions, favorites, playlists,
          request history, and party visit records) at that time. Songs already
          in a live party queue can finish, but they are no longer linked to
          your account.
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
