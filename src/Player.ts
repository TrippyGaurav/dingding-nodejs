
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

export interface socketConnectionData {
  socket: Socket | null;
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
  platformData: socketConnectionData;
  gameData: socketConnectionData;
  currentGameData: currentGamedata;
  playerData: playerData;
  gameId: string | null;

  constructor(
    username: string,
    role: string,
    credits: number,
    userAgent: string,
    socket: Socket
  ) {

    // Initialize platform socket and its related data
    this.platformData = {
      socket: socket,
      heartbeatInterval: setInterval(() => { }, 0),
      reconnectionAttempts: 0,
      maxReconnectionAttempts: 3,
      reconnectionTimeout: 1000,
      cleanedUp: false
    }

    // Initialize game socket data (game socket is null at first)
    this.gameData = {
      socket: null,
      heartbeatInterval: setInterval(() => { }, 0),
      reconnectionAttempts: 0,
      maxReconnectionAttempts: 3,
      reconnectionTimeout: 1000,
      cleanedUp: false,
    };

    this.playerData = {
      username,
      role,
      credits,
      userAgent
    };

    this.gameId = null;

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
  }

  // Initialze or update the game socket when a game is required
  private initializeGameSocket(socket: Socket) {
    if (this.gameData.socket) {
      this.cleanupGameSocket(); // Clean up previous game socket if it exists
    }

    this.gameData.socket = socket;
    this.gameId = socket.handshake.auth.gameId;
    this.gameData.socket.on("disconnect", () => this.handleGameDisconnection());

    this.initGameData(); // Initialize game-specific data
    this.startGameHeartbeat(); // Start a heartbeat for the game socket
    this.onExit(); // Handle user exit for game
    this.messageHandler(); // handle game messages
    this.gameData.socket.emit("socketState", true);
  }

  // Handle platform disconnection and reconnection
  private handlePlatformDisconnection() {
    this.attemptReconnection(this.platformData)
  }

  // Handle game disconnection and reconnection
  private handleGameDisconnection() {
    this.attemptReconnection(this.gameData);
  }

  // Cleanup only the game socket
  private cleanupGameSocket() {
    if (this.gameData.socket) {
      this.gameData.socket.disconnect(true);
      this.gameData.socket = null;
    }
    clearInterval(this.gameData.heartbeatInterval);
    this.currentGameData.currentGameManager = null;
    this.currentGameData.gameSettings = null;
    this.gameId = null;  // Reset gameId when game socket is cleaned up
    this.gameData.reconnectionAttempts = 0;
  }

  // Cleanup only the platform socket
  private cleanupPlatformSocket() {
    if (this.platformData.socket) {
      this.platformData.socket.disconnect(true);
      this.platformData.socket = null;
    }
    clearInterval(this.platformData.heartbeatInterval);
    this.platformData.reconnectionAttempts = 0;
  }

  // Attempt reconnection  for platform or game socket based on provided data
  private async attemptReconnection(socketData: socketConnectionData) {

    try {
      while (socketData.reconnectionAttempts < socketData.maxReconnectionAttempts) {
        await new Promise((resolve) => setTimeout(resolve, socketData.reconnectionTimeout));
        socketData.reconnectionAttempts++;
        if (socketData.cleanedUp) return;
        if (socketData.socket && socketData.socket.connected) {
          socketData.reconnectionAttempts = 0;
          return;
        }
      }

      if (socketData === this.platformData) {
        this.cleanupPlatformSocket(); // Clean up platform socket after max attempts 
      } else {
        this.cleanupGameSocket() // Clean up game socket after max attempts
      }
    } catch (error) {
      console.error("Reconnection attempt failed:", error);
    }
  }


  // Start heartbeat for platform socket
  private startPlatformHeartbeat() {
    this.platformData.heartbeatInterval = setInterval(() => {
      if (this.platformData.socket) {
        this.sendAlert(`Platform is alive for ${this.playerData.username}`);
      }
    }, 20000);  // 20 seconds
  }

  // Start heartbeat for game socket
  private startGameHeartbeat() {
    this.gameData.heartbeatInterval = setInterval(() => {
      if (this.gameData.socket) {
        this.sendAlert(`Game is alive for ${this.playerData.username}`);
      }
    }, 20000);  // 20 seconds
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
    if (!this.gameData.socket) return;

    try {
      const tagName = this.gameId;
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


  public sendMessage(action: string, message: any, isGameSocket: boolean = false) {
    const socket = isGameSocket ? this.gameData.socket : this.platformData.socket;
    if (socket) {
      socket.emit(
        messageType.MESSAGE,
        JSON.stringify({ id: action, message, username: this.playerData.username })
      )
    }
  }
  // Send an error message to the client (either platform or game)
  public sendError(message: string, isGameSocket: boolean = false) {
    const socket = isGameSocket ? this.gameData.socket : this.platformData.socket;
    if (socket) {
      socket.emit(messageType.ERROR, message)
    }
  }

  // Send an alert to the client (platform or game)
  public sendAlert(message: string, isGameSocket: boolean = false) {
    const socket = isGameSocket ? this.gameData.socket : this.platformData.socket;
    if (socket) {
      socket.emit(messageType.ALERT, message)
    }
  }

  // Handle client message communication for the game socket
  private messageHandler(isGameSocket: boolean = false) {
    const socket = isGameSocket ? this.gameData.socket : this.platformData.socket;

    if (socket) {
      socket.on("message", (message) => {
        try {
          const response = JSON.parse(message);
          console.log(`Message received from ${this.playerData.username}:`, message);

          if (isGameSocket) {
            // Delegate message to the current game manager's handler for game-specific logic
            this.currentGameData.currentGameManager.currentGameType.currentGame.messageHandler(response);
          } else {
            // Handle platform-specific messages here if needed
            console.log(`Platform message received: ${response}`);
          }
        } catch (error) {
          console.error("Failed to parse message:", error);
          this.sendError("Failed to parse message", isGameSocket);
        }
      })
    }
  }


  // Handle user exit event for the game or platform
  public onExit(isGameSocket: boolean = false) {
    const socket = isGameSocket ? this.gameData.socket : this.platformData.socket;
    if (socket) {
      socket.on("EXIT", () => {
        if (isGameSocket) {
          console.log(`${this.playerData.username} exits from game ${this.gameId}`);
          this.sendMessage('ExitUser', '', true);  // Notify game exit
          this.cleanupGameSocket(); // Clean up game socket
        } else {
          console.log(`${this.playerData.username} exits from the platform.`);
          this.cleanupPlatformSocket(); // Clean up platform socket
          users.delete(this.playerData.username)
        }
      })
    }
  }

  public forceExit(isGameSocket: boolean = false) {
    // Send a forced exit alert to the correct socket (game or platform)
    this.sendAlert("ForcedExit", isGameSocket);
    // If the user is exiting the game, only clean up the game socket

    if (isGameSocket) {
      this.cleanupGameSocket();  // Clean up the game socket only
    } else {
      // If the user is exiting the platform, clean up both platform and game sockets and remove from the users map
      this.cleanupPlatformSocket();  // Clean up the platform socket
      this.cleanupGameSocket();  // Optionally, also clean up the game socket if needed
      users.delete(this.playerData.username);  // Remove from active users map (platform exit)
    }
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
  }
}
