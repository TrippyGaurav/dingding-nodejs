import { Socket } from "socket.io";
import { MESSAGEID, MESSAGETYPE } from "../utils/utils";
import { verifySocketToken } from "../utils/playerAuth";
import { Player } from "../dashboard/users/userModel";
export let users: Map<string, SocketUser> = new Map();
import { gameData } from "../game/slotBackend/testData";
import { Payouts } from "../dashboard/games/gameModel";
import { GData, PlayerData } from "../game/Global.";
import { GAMETYPE } from "../game/Utils/globalTypes";
import { slotMessages } from "../game/slotBackend/slotMessages";
import { slotGameSettings } from "../game/slotBackend/_global";
import { kenoMessages } from "../game/kenoBackend/kenoMessages";
import { Platform } from "../dashboard/games/gameModel";



export class SocketUser {
  socket: Socket;
  isAlive: boolean = false;
  username: string;
  role: string;
  gameTag: string;
  constructor(socket: Socket, public GameData: any) {
    this.isAlive = true;
    this.socket = socket;
    this.username = socket.data?.username;
    this.role = socket.data?.role;
    this.handleAuth();
    this.socket.on("pong", this.heartbeat);
    this.socket.on(MESSAGEID.AUTH, this.initGameData);
    this.socket.on("message", this.messageHandler());
    this.socket.on("disconnect", () => this.deleteUserFromMap());
  }

  initGameData = async (message: any) => {
    try {
      const messageData = JSON.parse(message);
      const tagName = messageData.Data.GameID;
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

      const game = platform[0].game;
      // console.log(game, "Game");

      if (!game || !game.payout) {
        console.log('NO GAME FOUND WITH THIS GAME ID, SWIFTING PAYOUTS TO SL-VIK');
        slotGameSettings.initiate(gameData[0], this.socket.id);
        return;
      }

      const payoutData = await Payouts.find({ _id: { $in: game.payout } });
      const gameType = tagName.split('-');
      this.gameTag = gameType[0];
      if (gameType == GAMETYPE.SLOT)
        console.log('SLOT INITITATED')
      slotGameSettings.initiate(payoutData[0].data, this.socket.id);
      if (gameType == GAMETYPE.KENO) {
        console.log("KENO  GAME INITITATED");
      }

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


  messageHandler = () => {
    return (message: any) => {
      const messageData = JSON.parse(message);
      console.log("message " + JSON.stringify(messageData));
      if (this.gameTag == GAMETYPE.SLOT)
        slotMessages(messageData, this.socket.id);
      if (this.gameTag == GAMETYPE.KENO)
        kenoMessages(messageData, this.socket.id);
    };

  };

  handleAuth = async () => {
    try {
      const CurrentUser = await Player.findOne({
        username: this.username,
      }).exec();
      if (CurrentUser) {

        PlayerData.Balance = CurrentUser.credits;
        console.log("BALANCE " + PlayerData.Balance);

        this.sendMessage(MESSAGEID.AUTH, CurrentUser.credits);
      } else {
        this.sendError("USER_NOT_FOUND", "User not found in the database");
      }
    } catch (error) {
      console.error("Error handling AUTH message:", error);
      this.sendError("AUTH_ERROR", "An error occurred during authentication");
    }

  }
  deductPlayerBalance(credit: number) {
    this.checkBalance();
    PlayerData.Balance -= credit;
    this.updateCreditsInDb();

  }
  updatePlayerBalance(credit: number) {
    PlayerData.Balance += credit;
    PlayerData.haveWon += credit;
    PlayerData.currentWining = credit;
    this.updateCreditsInDb();
  }


  deleteUserFromMap = () => {
    const clientID = this.socket.id;
    if (users.get(clientID)) {
      users.delete(clientID);
      console.log(`User with ID ${clientID} was successfully removed.`);
    } else {
      console.log(`No user found with ID ${clientID}.`);
    }
  };


  //Update player credits case win ,bet,and lose;
  async updateCreditsInDb() {
    console.log(PlayerData.Balance, "finalbalance")
    await Player.findOneAndUpdate(
      { username: this.username },
      {
        credits: PlayerData.Balance,
      }
    );

  }
  checkBalance() {
    // if(playerData.Balance < gameWining.currentBet)
    if (PlayerData.Balance < slotGameSettings.currentBet) {
      // Alerts(clientID, "Low Balance");
      this.sendMessage("low-balance", true)
      console.log(PlayerData.Balance, "player balance")
      console.log(slotGameSettings.currentBet, "currentbet")
      console.warn("LOW BALANCE ALErt");
      console.error("Low Balance ALErt");
      return;
    }
  }
}

export async function initializeUser(socket: Socket) {
  try {
    const decoded = await verifySocketToken(socket);
    socket.data.username = decoded.username;
    socket.data.designation = decoded.role;
    GData.playerSocket = new SocketUser(socket, socket);
    users.set(GData.playerSocket.socket.id, GData.playerSocket);
    // Send the game and payout data to the client
    // socket.emit("initialize", { game, payoutData });

  } catch (err) {
    console.error(err.message);
    socket.disconnect();
  }
}

export function sendAlert(skt: Socket, message: string) {
  this.socket.emit(MESSAGETYPE.ALERT, message);
}

export function sendMessage(skt: Socket, id: string, message: any) {
  this.socket.emit(MESSAGETYPE.MESSAGE, JSON.stringify({ id, message }));
}


export const betMultiplier = [0.1, 0.5, 0.7, 1];



