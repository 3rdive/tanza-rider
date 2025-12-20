import { io, Socket } from "socket.io-client";
import { BASE_URL } from "./api";

export type SocketAuth = {
  token?: string | null;
};

export function createSocket(auth?: SocketAuth): Socket {
  const url = new URL(BASE_URL);
  const finalurl = `${url.hostname}:3006`;
  const socket = io(finalurl, {
    transports: ["websocket"],
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 500,
    reconnectionAttempts: Infinity,
    auth: auth?.token ? { token: auth.token } : undefined,
  });
  return socket;
}
