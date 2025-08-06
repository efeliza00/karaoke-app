import { io } from "socket.io-client";
const baseUrl = import.meta.env.VITE_SERVER_URL || window.location.origin;
export const socket = io(baseUrl);
