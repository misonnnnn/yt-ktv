export type QueueItem = {
  id: string;
  position: number;
  singer: string;
  title: string;
  artist: string;
};

export type SearchResult = {
  id: string;
  title: string;
  artist: string;
  channel: string;
  duration: string;
};

export type PartyInfo = {
  name: string;
  hostName: string;
  roomId: string;
  guestCount: number;
};

export type CurrentSong = {
  title: string;
  artist: string;
  singer: string;
};
