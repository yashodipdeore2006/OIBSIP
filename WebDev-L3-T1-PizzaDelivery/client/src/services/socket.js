import { io } from "socket.io-client";

let socket = null;

export const connectSocket = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    return null;
  }

  if (socket?.connected) {
    return socket;
  }

  socket = io("http://localhost:5000", {
    autoConnect: false,
    auth: {
      token,
    },
  });

  socket.connect();

  return socket;
};

export const disconnectSocket = () => {
  if (!socket) {
    return;
  }

  socket.disconnect();

  socket = null;
};

export const getSocket = () => {
  return socket;
};