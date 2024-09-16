
import { Socket } from "socket.io";
import mongoose from "mongoose";
import { Player } from "./dashboard/users/userModel";
import { Platform } from "./dashboard/games/gameModel";
import payoutController from "./dashboard/payouts/payoutController";
import { getPlayerCredits, messageType } from "./game/Utils/gameUtils";
import { gameData } from "./game/testData";
import { users } from "./socket";
import GameManager from "./game/GameManager";
import createHttpError from "http-errors";

export interface currentGamedata {
  username: string,
  currentGameManager: GameManager;
  gameSettings: any;
  sendMessage: (action: string, message: any) => void;
  sendError: (message: string) => void;
  sendAlert: (message: string) => void;
  updatePlayerBalance: (message: number) => void;
  deductPlayerBalance: (message: number) => void;
  getPlayerData: () => playerData;
}

export interface socketData {
  gameSocket: Socket | null;
  heartbeatInterval: NodeJS.Timeout;
  reconnectionAttempts: number;
  maxReconnectionAttempts: number;
  reconnectionTimeout: number;
  cleanedUp: boolean;
}

export interface playerData {
  username: string;
  role: string;
  credits: number;
  userAgent: string;
}


export default class PlayerSocket {
  socketData: socketData;
  currentGameData: currentGamedata;
  playerData: playerData;

  constructor(
    username: string,
    role: string,
    credits: number,
    userAgent: string,
    gameSocket: Socket,
    public gameId: string
  ) {

    this.socketData = {
      gameSocket: null,
      heartbeatInterval: setInterval(() => { }, 0),
      reconnectionAttempts: 0,
      maxReconnectionAttempts: 1,
      reconnectionTimeout: 1000,
      cleanedUp: false,
    };

    this.playerData = {
      username,
      role,
      credits,
      userAgent
    };

    this.currentGameData = {
      currentGameManager: null, // Will be initialized later
      gameSettings: null,
      sendMessage: this.sendMessage.bind(this),
      sendError: this.sendError.bind(this),
      sendAlert: this.sendAlert.bind(this),
      updatePlayerBalance: this.updatePlayerBalance.bind(this),
      deductPlayerBalance: this.deductPlayerBalance.bind(this),
      getPlayerData: () => this.playerData,
      username: this.playerData.username
    };
    console.log("Welcome : ", this.playerData.username);
    this.initializeGameSocket(gameSocket);
  }

  private initializeGameSocket(socket: Socket) {
    this.socketData.gameSocket = socket;
    this.gameId = socket.handshake.auth.gameId;
    this.socketData.gameSocket.on("disconnect", () => this.handleGameDisconnection());
    this.initGameData();
    this.startHeartbeat();
    this.onExit();
    this.messageHandler();
    socket.emit("socketState", true);
  }

  private handleGameDisconnection() {
    this.attemptReconnection();
  }

  public sendMessage(action: string, message: any) {
    this.socketData.gameSocket.emit(
      messageType.MESSAGE,
      JSON.stringify({
        id: action,
        message,
        username: this.playerData.username,
      })
    );
  }

  public sendError(message: string) {
    this.socketData.gameSocket.emit(messageType.ERROR, message);
  }

  public sendAlert(message: string) {
    this.socketData.gameSocket.emit("alert", message);
  }

  private messageHandler() {
    this.socketData.gameSocket.on("message", (message) => {
      try {
        const response = JSON.parse(message);
        console.log(`Message Recieved for ${this.playerData.username} : `, message);
        this.currentGameData.currentGameManager.currentGameType.currentGame.messageHandler(response);
      } catch (error) {
        console.error("Failed to parse message:", error);
        this.sendError("Failed to parse message");
      }
    });
  }


  private async updateDatabase() {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const finalBalance = this.playerData.credits;
      await Player.findOneAndUpdate(
        { username: this.playerData.username },
        { credits: finalBalance.toFixed(2) },
        { new: true, session }
      );
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      // console.error("Failed to update database:", error);
      this.sendError("Database error");
    } finally {
      session.endSession();
    }
  }

  private checkPlayerBalance(bet: number) {
    if (this.playerData.credits < bet) {
      this.sendMessage("low-balance", true);
      console.error("LOW BALANCE");
    }
  }

  public async updatePlayerBalance(credit: number) {
    try {
      this.playerData.credits += credit;
      await this.updateDatabase();
    } catch (error) {
      console.error("Error updating credits in database:", error);
    }
  }

  public async deductPlayerBalance(currentBet: number) {
    this.checkPlayerBalance(currentBet);
    this.playerData.credits -= currentBet;
    await this.updateDatabase();
  }

  private async attemptReconnection() {
    try {
      while (this.socketData.reconnectionAttempts < this.socketData.maxReconnectionAttempts) {
        await new Promise((resolve) => setTimeout(resolve, this.socketData.reconnectionTimeout));
        this.socketData.reconnectionAttempts++;
        if (this.socketData.cleanedUp) return;
        if (this.socketData.gameSocket && this.socketData.gameSocket.connected) {
          this.socketData.reconnectionAttempts = 0;
          return;
        }
      }
      users.delete(this.playerData.username);
      this.cleanup();
      throw createHttpError(403, "Please wait to disconnect")
    } catch (error) {
      console.error("Reconnection attempt failed:", error);
    }
  }

  private startHeartbeat() {
    this.socketData.heartbeatInterval = setInterval(() => {
      if (this.socketData.gameSocket) {
        this.sendAlert(`I'm Alive ${this.playerData.username}`);
      }
    }, 20000); // 20 seconds
  }

  private cleanup() {
    if (this.socketData.gameSocket) {

      this.socketData.gameSocket.disconnect(true);
      this.socketData.gameSocket = null;
    }
    clearInterval(this.socketData.heartbeatInterval);

    this.playerData = {
      username: "",
      role: "",
      credits: 0,
      userAgent: ""
    };
    this.gameId = null
    this.currentGameData = {
      currentGameManager: null,
      gameSettings: null,
      sendMessage: this.sendMessage.bind(this),
      sendError: this.sendError.bind(this),
      sendAlert: this.sendAlert.bind(this),
      updatePlayerBalance: this.updatePlayerBalance.bind(this),
      deductPlayerBalance: this.deductPlayerBalance.bind(this),
      getPlayerData: () => this.playerData,
      username: this.playerData.username,
    };
    this.socketData = {
      ...this.socketData,
      reconnectionAttempts: 0,
      cleanedUp: true,
    };
  }

  public onExit() {
    this.socketData.gameSocket?.on("EXIT", () => {
      console.log(this.playerData.username, "EXITS FROM", this.gameId);
      this.sendMessage('ExitUser', '')
      users.delete(this.playerData.username);
      this.cleanup();
    });
  }


  public forceExit() {
    this.sendAlert("ForcedExit");
    users.delete(this.playerData.username);
    this.cleanup();
  }
  public async updateGameSocket(socket: Socket) {
    if (socket.request.headers["user-agent"] !== this.playerData.userAgent) {
      socket.emit("alert", {
        id: "AnotherDevice",
        message: "You are already playing on another browser",
      });
      socket.disconnect(true);
      throw createHttpError(403, "You are already playing on another browser")

    }
    this.initializeGameSocket(socket);
    const credits = await getPlayerCredits(this.playerData.username);
    this.playerData.credits = typeof credits === "number" ? credits : 0;
  }

  private async initGameData() {
    if (!this.socketData.gameSocket) return;

    try {
      const tagName = this.gameId;
      console.log(tagName)
      const platform = await Platform.aggregate([
        { $unwind: "$games" },
        { $match: { "games.tagName": tagName, "games.status": "active" } },
        { $project: { _id: 0, game: "$games" } },
      ]);


      if (platform.length === 0) {
        this.currentGameData.gameSettings = { ...gameData[0] };
        this.currentGameData.currentGameManager = new GameManager(this.currentGameData);
        return;
      }

      const game = platform[0].game;
      const payout = await payoutController.getPayoutVersionData(game.tagName, game.payout);

      if (!payout) {
        this.currentGameData.gameSettings = { ...gameData[0] };
        this.currentGameData.currentGameManager = new GameManager(this.currentGameData);
        return;
      }

      this.currentGameData.gameSettings = { ...payout };
      this.currentGameData.currentGameManager = new GameManager(this.currentGameData);
    } catch (error) {
      console.error(`Error initializing game data for user ${this.playerData.username}:`, error);
    }
  }
}
