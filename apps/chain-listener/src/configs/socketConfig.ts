import { Server } from "socket.io";
import { Server as HttpServer } from "node:http";

let io: Server | undefined;

export const initSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: { origin: "http://localhost:3000" },
  });
  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};
