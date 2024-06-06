import { Socket } from "socket.io";
import { MESSAGEID, MESSAGETYPE } from "../utils/utils";
import { gameSettings } from "../game/global";
import { CheckResult } from "../game/slotResults";
import { getRTP } from "../game/rtpgenerator";
import { verifySocketToken } from "../middleware/authMiddleware";
export let users: Map<string, User> = new Map();

export class User {
  socket: Socket;
  isAlive: boolean = false;
  username: string;
  designation: string;
  constructor(socket: Socket) {
    this.isAlive = true;
    this.socket = socket;
    this.username = socket?.data?.username;
    this.designation = socket?.data?.designation;
    // console.log(
    //   "Client if from users:",
    //   socket.id,
    //   this.username,
    //   this.designation
    // );

    socket.on("pong", this.heartbeat);
    socket.on("message", this.messageHandler());
    socket.on(MESSAGEID.AUTH, (message: any) => {
      const messageData = JSON.parse(message);
      // console.log(`Auth Message : ${JSON.stringify(messageData)}`);
      // console.log(messageData.Data.GameID);

      gameSettings.initiate(messageData.Data.GameID, this.socket.id);
    });
    socket.on("disconnect", () => this.deleteUserFromMap());
  }

  sendError(errorCode: string, message: any) {
    const params = {
      errorCode: errorCode,
      message: message,
    };
    this.socket.emit(MESSAGETYPE.ERROR, params);
  }

  sendAlert(message: string) {
    this.socket.emit(MESSAGETYPE.ALERT, message);
  }

  sendMessage(id: string, message: any) {
    this.socket.emit(MESSAGETYPE.MESSAGE, JSON.stringify({ id, message }));
  }

  heartbeat = () => {
    this.isAlive = true;
  };

  messageHandler = () => {
    return (message: any) => {
      const messageData = JSON.parse(message);

      if (messageData.id === MESSAGEID.SPIN && gameSettings.startGame) {
        gameSettings.currentBet = messageData.data.currentBet;
        new CheckResult(this.socket.id);
      }
      if (messageData.id == MESSAGEID.GENRTP) {
        gameSettings.currentBet = messageData.data.currentBet;
        getRTP(this.socket.id, messageData.data.spins);
      }

      if (messageData.id === MESSAGEID.GAMBLE) {
      }
    };
  };

  deleteUserFromMap = () => {
    // Attempt to delete the user from the map
    const clientID = this.socket.id;

    if (getClient(clientID)) {
      users.delete(clientID);
      console.log(`User with ID ${clientID} was successfully removed.`);
    } else {
      console.log(`No user found with ID ${clientID}.`);
    }
  };
}

export function initializeUser(socket: Socket) {
  verifySocketToken(socket)
    .then((decoded) => {
      socket.data.username = decoded.username;
      socket.data.designation = decoded.designation;

      const user = new User(socket);
      users.set(user.socket.id, user);
      // console.log("User initialized:", user);
    })
    .catch((err) => {
      console.error(err.message);
      socket.disconnect();
    });
}

export function getClient(clientId: string) {
  const user = users.get(clientId);
  return user;
}
