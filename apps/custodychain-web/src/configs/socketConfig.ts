"use client";

import { io, Socket } from "socket.io-client";

let socket: Socket | undefined;

export const getSocket = () => {
  if (!socket) {
    socket = io("http://localhost:4000", {});
  }
  return socket;
};
