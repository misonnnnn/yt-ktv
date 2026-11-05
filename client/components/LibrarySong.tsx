"use client";

type LibrarySongProps = {
  title: string | null;
  artist: string | null;
  thumbnail: string | null;
  meta?: string;
  addLabel?: string;
  adding?: boolean;
  onAdd?: () => void;
  onRemove?: () => void;
  removeLabel?: string;
};

export default function LibrarySong({
  title,
  artist,
  thumbnail,
  meta,
  addLabel = "Add to party",
  adding = false,
  onAdd,
  onRemove,
  removeLabel = "Remove",
}: LibrarySongProps) {
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-ktv-card-border bg-ktv-card/70 p-3">
      {thumbnail ? (
        <img
          src={thumbnail}
          alt=""
          className="h-14 w-20 shrink-0 rounded-lg object-cover sm:h-16 sm:w-24"
        />
      ) : (
        <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-900/70 to-pink-900/40 sm:h-16 sm:w-24">
          <span className="text-xl">🎵</span>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-white">{title || "Saved video"}</p>
        <p className="truncate text-sm text-white/50">{artist || "YouTube"}</p>
        {meta && <p className="truncate text-xs text-white/35">{meta}</p>}
      </div>
      <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            disabled={adding}
            className="ktv-btn-primary rounded-xl px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            {adding ? "Adding..." : addLabel}
          </button>
        )}
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="ktv-btn-secondary rounded-xl px-3 py-2 text-xs text-white"
          >
            {removeLabel}
          </button>
        )}
      </div>
    </li>
  );
}

export function Notice({
  tone = "error",
  children,
}: {
  tone?: "error" | "ok";
  children: string;
}) {
  const color =
    tone === "ok" ? "bg-emerald-500/15 text-emerald-200" : "bg-red-500/20 text-red-300";
  return <div className={`rounded-xl px-4 py-3 text-sm ${color}`}>{children}</div>;
}

export const fieldClass =
  "w-full rounded-xl border border-ktv-card-border bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500";
