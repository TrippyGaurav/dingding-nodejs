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
import { Platform, Payouts } from "../dashboard/games/gameModel";
import { gameData } from "../game/testData";

export class SocketUser {
  socket: Socket;
  isAlive: boolean = false;
  username: string;
  role: string;

  constructor(socket: Socket) {
    this.isAlive = true;
    this.socket = socket;
    this.username = socket.data?.username;
    this.role = socket.data?.role;
    this.handleAuth();
    this.socket.on("pong", this.heartbeat);
    this.socket.on("message", this.messageHandler);
    this.socket.on(MESSAGEID.AUTH, this.initGameData);
    this.socket.on("disconnect", this.deleteUserFromMap);
  }

  initGameData = async (message: any) => {
    try {
      const messageData = JSON.parse(message);
      const tagName = messageData.Data.GameID || "SL-VIK";
      const platform = await Platform.aggregate([
        { $unwind: "$games" },
        { $match: { "games.tagName": tagName } },
        {
          $project: {
            _id: 0,
            game: "$games"
          }
        }
      ]);

      const game = platform[0]?.game;
      if (!game || !game.payout) {
        console.log('NO GAME FOUND WITH THIS GAME ID, SWITCHING PAYOUTS TO SL-VIK');
        gameSettings.initiate(gameData[0], this.socket.id);
        return;
      }

      const payoutData = await Payouts.find({ _id: { $in: game.payout } });
      gameSettings.initiate(payoutData[0].data, this.socket.id);
    } catch (error) {
      console.error('Error initializing game data:', error);
    }
  };

  sendError = (errorCode: string, message: any) => {
    const params = {
      errorCode: errorCode,
      message: message,
    };
    console.log("ERROR " + errorCode + "  :  " + message);
    this.socket.emit(MESSAGETYPE.ERROR, params);
  };

  sendAlert = (message: string) => {
    this.socket.emit(MESSAGETYPE.ALERT, message);
  };

  sendMessage = (id: string, message: any) => {
    this.socket.emit(MESSAGETYPE.MESSAGE, JSON.stringify({ id, message }));
  };

  heartbeat = () => {
    this.isAlive = true;
  };

  messageHandler = (message: any) => {
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
      console.log(this.socket.id, "cuurectSocket")
      getRTP(this.socket.id, messageData.data.spins);
    }

    if (messageData.id === MESSAGEID.GAMBLE) {
      // Handle GAMBLE message
    }
  };

  handleAuth = async () => {
    try {
      const CurrentUser = await Player.findOne({
        username: this.username,
      }).exec();
      if (CurrentUser) {
        playerData.Balance = CurrentUser.credits;
        console.log("BALANCE " + playerData.Balance);
        this.sendMessage(MESSAGEID.AUTH, CurrentUser.credits);
      } else {
        this.sendError("USER_NOT_FOUND", "User not found in the database");
      }
    } catch (error) {
      console.error("Error handling AUTH message:", error);
      this.sendError("AUTH_ERROR", "An error occurred during authentication");
    }
  };

  deleteUserFromMap = () => {
    const clientID = this.socket.id;
    if (getClient(clientID)) {
      users.delete(clientID);
      console.log(`User with ID ${clientID} was successfully removed.`);
    } else {
      console.log(`No user found with ID ${clientID}.`);
    }
  };

  updateCreditsInDb = async (finalBalance: number) => {
    const formattedNumber = finalBalance.toFixed(1);
    console.log(formattedNumber, "finalba;");

    await Player.findOneAndUpdate(
      { username: this.username },
      {
        credits: formattedNumber,
      }
    );
  };
}

export async function initializeUser(socket: Socket) {
  try {
    const decoded = await verifySocketToken(socket);
    socket.data.username = decoded.username;
    socket.data.role = decoded.role;
    const user = new SocketUser(socket);
    users.set(user.socket.id, user);
    console.log(users);
  } catch (err) {
    console.error(err.message);
    socket.disconnect();
  }
}

export function getClient(clientId: string) {
  return users.get(clientId);
}

export const betMultiplier = [0.1, 0.25, 0.5, 0.75, 1];
