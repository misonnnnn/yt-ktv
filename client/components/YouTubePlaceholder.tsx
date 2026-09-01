type YouTubePlaceholderProps = {
  title?: string;
  artist?: string;
};

export default function YouTubePlaceholder({
  title = "Perfect",
  artist = "Ed Sheeran",
}: YouTubePlaceholderProps) {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-ktv-card-border bg-black ktv-glow">
      {/* Fake video frame */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
        {/* Simulated karaoke lyrics area */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8">
          <div className="rounded-full bg-red-600 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white">
            Karaoke
          </div>
          <p className="text-center text-3xl font-bold text-white drop-shadow-lg md:text-5xl">
            {title}
          </p>
          <p className="text-lg text-white/60 md:text-xl">{artist}</p>
          {/* Fake progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
            <div className="h-full w-1/3 bg-red-500" />
          </div>
        </div>
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
            <div className="ml-1 h-0 w-0 border-y-[14px] border-l-[24px] border-y-transparent border-l-white/90" />
          </div>
        </div>
        {/* YouTube-style bottom bar */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2 bg-gradient-to-t from-black/80 to-transparent px-4 py-3">
          <div className="h-8 w-8 rounded-full bg-red-600" />
          <span className="text-sm text-white/70">YouTube Player</span>
        </div>
      </div>
    </div>
  );
}
