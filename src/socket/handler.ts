import { Server } from "socket.io";

export const messageHandler = (socket: Server) => {
  return (message: any) => {
    const messageData = JSON.parse(message);
    console.log("Message : ", messageData);
  };
};
