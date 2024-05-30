import { Server, Socket } from "socket.io";
import { MESSAGEID } from "../utils/utils";

export const messageHandler = (socket: Server, clientId: string) => {
  return (message: any) => {
    const messageData = JSON.parse(message);
    console.log(
      `Received message from ${clientId}: ${JSON.stringify(messageData)}`
    );

    if (messageData.id == MESSAGEID.AUTH) {
      //   gameSettings.initiate(messageData.Data.GameID, clientId);
    }

    if (messageData.id === MESSAGEID.SPIN) {
    }

    if (messageData.id === MESSAGEID.GAMBLE) {
    }
  };
};
