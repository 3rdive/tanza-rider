import { io, Socket } from "socket.io-client";

export const SOCKET_URL = "http://localhost:3006";

export type SocketAuth = {
  token?: string | null;
};

export function createSocket(auth?: SocketAuth): Socket {
  const socket = io(SOCKET_URL, {
    transports: ["websocket"],
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 500,
    reconnectionAttempts: Infinity,
    auth: auth?.token ? { token: auth.token } : undefined,
  });
  return socket;
}
