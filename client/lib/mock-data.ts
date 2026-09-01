import type { CurrentSong, PartyInfo, QueueItem, SearchResult } from "./types";

export const MOCK_ROOM_ID = "KTV-7X2M";

export const mockParty: PartyInfo = {
  name: "Karaoke Night",
  hostName: "John",
  roomId: MOCK_ROOM_ID,
  guestCount: 4,
};

export const mockCurrentSong: CurrentSong = {
  title: "Perfect",
  artist: "Ed Sheeran",
  singer: "John",
};

export const mockQueue: QueueItem[] = [
  {
    id: "1",
    position: 1,
    singer: "Sarah",
    title: "Love Story",
    artist: "Taylor Swift",
  },
  {
    id: "2",
    position: 2,
    singer: "Mike",
    title: "My Way",
    artist: "Frank Sinatra",
  },
  {
    id: "3",
    position: 3,
    singer: "Anna",
    title: "A Thousand Years",
    artist: "Christina Perri",
  },
];

export const mockSearchResults: SearchResult[] = [
  {
    id: "s1",
    title: "Perfect",
    artist: "Ed Sheeran",
    channel: "Sing King Karaoke",
    duration: "4:23",
  },
  {
    id: "s2",
    title: "Love Story",
    artist: "Taylor Swift",
    channel: "Karaoke Version",
    duration: "3:56",
  },
  {
    id: "s3",
    title: "A Thousand Years",
    artist: "Christina Perri",
    channel: "ProSound Karaoke",
    duration: "4:45",
  },
  {
    id: "s4",
    title: "Shallow",
    artist: "Lady Gaga & Bradley Cooper",
    channel: "Sing King Karaoke",
    duration: "3:35",
  },
  {
    id: "s5",
    title: "Bohemian Rhapsody",
    artist: "Queen",
    channel: "Karaoke Hits",
    duration: "5:54",
  },
];

export function getJoinUrl(roomId: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/join/${roomId}`;
  }
  return `http://localhost:3000/join/${roomId}`;
}
