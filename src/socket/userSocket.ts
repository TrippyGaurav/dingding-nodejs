import { Socket } from "socket.io";
import { MESSAGEID, MESSAGETYPE } from "../utils/utils";
import { verifySocketToken } from "../utils/playerAuth";
import { Player } from "../dashboard/users/userModel";
export let users: Map<string, SocketUser> = new Map();
import { gameData } from "../game/slotBackend/testData";
import Game, { Payouts } from "../dashboard/games/gameModel";
import { GData } from "../game/Global.";
import { GAMETYPE } from "../game/Utils/globalTypes";
import { slotMessages } from "../game/slotBackend/slotMessages";
import { slotGameSettings } from "../game/slotBackend/_global";


export class SocketUser {
  socket: Socket;
  playerData: userData;
  isAlive: boolean = false;
  username: string;
  designation: string;
  gameTag : string;
  constructor(socket: Socket, public GameData: any) {
    this.isAlive = true;
    this.socket = socket;
    this.username = socket?.data?.username;
    this.designation = socket?.data?.designation;
    this.handleAuth();
    this.socket.on("pong", this.heartbeat);
    this.socket.on(MESSAGEID.AUTH, this.initGameData);
    this.socket.on("message", this.messageHandler());
    this.socket.on("disconnect", () => this.deleteUserFromMap());
  }

  initGameData = async (message: any) => {
    try {
      const messageData = JSON.parse(message);

      // Use "SL-VIK" as default tagName if messageData.Data.GameID is not present
      const tagName = messageData.Data.GameID;

      const game = await Game.findOne({ tagName: tagName });
      console.log(tagName, "Game");

      if (!game || !game.payout) {
        console.log('NO GAME FOUND WITH THIS GAME ID, SWIFTING PAYOUTS TO SL-VIK');
        slotGameSettings.initiate(this.socket,gameData[0], this.socket.id);
        return;
      }

      // Retrieve the payout JSON data
      const payoutData = await Payouts.find({ _id: { $in: game.payout } });
      console.log(payoutData)
      const gameType = tagName.map(ts => ts.split('-')[0]);
      this.gameTag = gameType;
      if(gameType ==  GAMETYPE.SLOT)
      slotGameSettings.initiate(this.socket,payoutData[0].data, this.socket.id);
      if(gameType == GAMETYPE.KENO)
      {
        console.log("KENO  GAME INITITATED");
      }
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


  heartbeat = () => {
    this.isAlive = true;
  };

  messageHandler = () => {
    return (message: any) => {
      const messageData = JSON.parse(message);
      console.log("message " + JSON.stringify(messageData));
      if(this.gameTag == GAMETYPE.SLOT)
      slotMessages(this.socket,messageData);

     
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
        this.playerData.Balance = CurrentUser.credits;
        console.log("BALANCE " + this.playerData.Balance);
        // console.log(this.username);
        // console.log("Player Balance users", CurrentUser.credits);
        sendMessage(this.socket,MESSAGEID.AUTH, CurrentUser.credits);
      } else {
        this.sendError("USER_NOT_FOUND", "User not found in the database");
      }
    } catch (error) {
      console.error("Error handling AUTH message:", error);
      this.sendError("AUTH_ERROR", "An error occurred during authentication");
    }
  }
  deductPlayerBalance(credit : number)
  {
    this.checkBalance();
    this.playerData.Balance -= credit;
    this.updateCreditsInDb();
    
  }
  updatePlayerBalance(credit : number)
  {
    this.playerData.Balance += credit;
    this.playerData.haveWon += credit;
    this.playerData.currentWining = credit;
    this.updateCreditsInDb();
  }

  deleteUserFromMap = () => {
    // Attempt to delete the user from the map
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
    console.log(this.playerData.Balance, "finalbalance")
    await Player.findOneAndUpdate(
      { username: this.username },
      {
        credits: this.playerData.Balance,
      }
    );
  }
  checkBalance() {
    // if(playerData.Balance < gameWining.currentBet)
    if (this.playerData.Balance < slotGameSettings.currentBet) {
      // Alerts(clientID, "Low Balance");
      sendMessage(this.socket,"low-balance", true)
      console.log(this.playerData.Balance, "player balance")


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

    socket.data.designation = decoded.designation;
    GData.playerSocket= new SocketUser(socket, socket);
    users.set(GData.playerSocket.socket.id, GData.playerSocket);
    // Send the game and payout data to the client
    // socket.emit("initialize", { game, payoutData });
  } catch (err) {
    console.error(err.message);
    socket.disconnect();
  }
}

export function sendAlert(skt : Socket, message: string) {
  this.socket.emit(MESSAGETYPE.ALERT, message);
}

export function sendMessage(skt : Socket, id: string, message: any) {
  this.socket.emit(MESSAGETYPE.MESSAGE, JSON.stringify({ id, message }));
}

export const betMultiplier = [0.1, 0.5, 0.7, 1];

interface userData {
  Balance: number;
  haveWon: number;
  currentWining: number;
}