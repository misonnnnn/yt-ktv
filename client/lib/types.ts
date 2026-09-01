export type QueueItem = {
  id: string;
  position: number;
  singer: string;
  title: string;
  artist: string;
  videoId?: string;
  thumbnail?: string;
  status?: string;
};

export type SearchResult = {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  publishedAt?: string;
};

export type RoomInfo = {
  id: number;
  roomCode: string;
  partyName: string;
  hostName: string;
};

export type NowPlaying = {
  queueId: number | null;
  videoId: string | null;
  songTitle: string | null;
  artist: string | null;
  singerName: string | null;
  thumbnail: string | null;
};

export type ApiQueueItem = {
  id: number;
  videoId: string;
  songTitle: string;
  artist: string;
  thumbnail: string;
  singerName: string;
  status: string;
  position: number;
};

export function toQueueItem(item: ApiQueueItem): QueueItem {
  return {
    id: String(item.id),
    position: item.position,
    singer: item.singerName,
    title: item.songTitle,
    artist: item.artist,
    videoId: item.videoId,
    thumbnail: item.thumbnail,
    status: item.status,
  };
}
