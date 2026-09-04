"use client";

import { io, Socket } from "socket.io-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export function connectToRoom(roomCode: string, name: string): Socket {
  const socket = io(API_URL, {
    transports: ["polling", "websocket"],
  });

  socket.on("connect", () => {
    socket.emit("room:join", { roomCode: roomCode.toUpperCase(), name });
  });

  return socket;
}
