import { Socket } from "socket.io";
import { MESSAGEID, MESSAGETYPE } from "../utils/utils";
import {
  checkforMoolah,
  gameSettings,
  playerData,
  spinResult,
} from "../game/global";
import { CheckResult } from "../game/slotResults";
import { getRTP } from "../game/rtpgenerator";
import { verifySocketToken } from "../utils/playerAuth";
import { Player } from "../dashboard/users/userModel";
export let users: Map<string, SocketUser> = new Map();
import { Payouts } from "../dashboard/games/gameModel";
// import { clientData } from "../dashboard/user/userController";
import { gameData } from "../game/testData";
import Game from "../dashboard/games/gameModel";
export class SocketUser {
  socket: Socket;
  isAlive: boolean = false;
  username: string;
  designation: string;
  constructor(socket: Socket, public GameData: any) {
    this.isAlive = true;
    this.socket = socket;
    this.username = socket?.data?.username;
    this.designation = socket?.data?.designation;
    this.handleAuth();
    this.socket.on("pong", this.heartbeat);
    this.socket.on("message", this.messageHandler());
    this.socket.on(MESSAGEID.AUTH, this.initGameData);
    this.socket.on("disconnect", () => this.deleteUserFromMap());
  }

  initGameData = async (message: any) => {
    try {
      const messageData = JSON.parse(message);

      // Use "SL-VIK" as default tagName if messageData.Data.GameID is not present
      const tagName = messageData.Data.GameID;
      const game = await Game.findOne({ tagName: tagName });
      console.log(game.payout, "Game");

      if (!game || !game.payout) {
        console.log('NO GAME FOUND WITH THIS GAME ID, SWIFTING PAYOUTS TO SL-VIK');
        gameSettings.initiate(gameData[0], this.socket.id);
        return;
      }

      // Retrieve the payout JSON data
      const payoutData = await Payouts.find({ _id: { $in: game.payout } });
      console.log(payoutData, "payout")
      gameSettings.initiate(payoutData[0].data, this.socket.id);
    } catch (error) {
      console.error('Error initializing game data:', error);
      // Handle error (e.g., send error response, disconnect socket, etc.)
    }
  };

  sendError(errorCode: string, message: any) {
    const params = {
      errorCode: errorCode,
      message: message,
    };
    console.log("ERROR " + errorCode + "  :  " + message);
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
      console.log("message " + JSON.stringify(messageData));

      if (messageData.id === "checkMoolah") {
        checkforMoolah();
      }
      if (messageData.id === MESSAGEID.SPIN && gameSettings.startGame) {
        gameSettings.currentLines = messageData.data.currentLines;
        gameSettings.BetPerLines = betMultiplier[messageData.data.currentBet];
        gameSettings.currentBet = betMultiplier[messageData.data.currentBet] * gameSettings.currentLines;

        spinResult(this.socket.id);
      }
      if (messageData.id == MESSAGEID.GENRTP) {
        gameSettings.currentLines = messageData.data.currentLines;
        gameSettings.BetPerLines = betMultiplier[messageData.data.currentBet];
        gameSettings.currentBet = betMultiplier[messageData.data.currentBet] * gameSettings.currentLines;

        getRTP(this.socket.id, messageData.data.spins);
      }

      if (messageData.id === MESSAGEID.GAMBLE) {
      }
    };
  };

  //to get the player initial balance after socket connection
  async handleAuth() {
    try {
      // const messageData = JSON.parse(message);
      const CurrentUser = await Player.findOne({
        username: this.username,
      }).exec();
      if (CurrentUser) {
        playerData.Balance = CurrentUser.credits;
        console.log("BALANCE " + playerData.Balance);
        // console.log(this.username);
        // console.log("Player Balance users", CurrentUser.credits);
        this.sendMessage(MESSAGEID.AUTH, CurrentUser.credits);
      } else {
        this.sendError("USER_NOT_FOUND", "User not found in the database");
      }
    } catch (error) {
      console.error("Error handling AUTH message:", error);
      this.sendError("AUTH_ERROR", "An error occurred during authentication");
    }
  }

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

  //Update player credits case win ,bet,and lose;
  async updateCreditsInDb(finalBalance: number) {
    console.log(finalBalance, "finalba;")
    await Player.findOneAndUpdate(
      { username: this.username },
      {
        credits: finalBalance,
      }
    );
  }
}

export async function initializeUser(socket: Socket) {
  try {
    const decoded = await verifySocketToken(socket);
    socket.data.username = decoded.username;
    socket.data.designation = decoded.designation;
    const user = new SocketUser(socket, socket);
    users.set(user.socket.id, user);
    // Send the game and payout data to the client
    // socket.emit("initialize", { game, payoutData });
  } catch (err) {
    console.error(err.message);
    socket.disconnect();
  }
}

export function getClient(clientId: string) {
  const user = users.get(clientId);
  return user;
}
export const betMultiplier = [0.1, 0.5, 0.7, 1]