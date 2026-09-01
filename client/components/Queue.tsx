import type { QueueItem } from "@/lib/types";

type QueueProps = {
  items: QueueItem[];
  title?: string;
  showRemove?: boolean;
  onRemove?: (id: string) => void;
  compact?: boolean;
};

export default function Queue({
  items,
  title = "Up Next",
  showRemove = false,
  onRemove,
  compact = false,
}: QueueProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-ktv-card-border bg-ktv-card/60 p-4">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-purple-300">
          {title}
        </h3>
        <p className="text-sm text-white/40">No songs in queue yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-ktv-card-border bg-ktv-card/60 p-4">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-purple-300">
        {title}
      </h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className={`flex items-center gap-3 rounded-xl bg-white/5 px-3 ${
              compact ? "py-2" : "py-3"
            }`}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-500/20 text-sm font-bold text-purple-300">
              {item.position}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-white">
                {item.singer}{" "}
                <span className="font-normal text-white/50">—</span> {item.title}
              </p>
              {!compact && (
                <p className="truncate text-sm text-white/50">{item.artist}</p>
              )}
            </div>
            {showRemove && onRemove && (
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="shrink-0 rounded-lg px-2 py-1 text-xs text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
              >
                Remove
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
