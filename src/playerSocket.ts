import { Socket } from "socket.io";
import { slotGameSettings } from "./game/slotBackend/_global";
import { verifyPlayerToken } from "./utils/playerAuth";
import { getPlayerCredits } from "./game/Global";
import { MESSAGEID } from "./utils/utils";
import { Platform } from "./dashboard/games/gameModel";
import { Payouts } from "./dashboard/games/gameModel";
import { gameData } from "./game/slotBackend/testData";

export let users: Map<string, SocketUser> = new Map();
const RECONNECT_TIMEOUT = 60000;
export class SocketUser {
  socketReady: boolean = false;
  username: string;
  role: string;
  credits: number;
  currentGame: any;
  platform: boolean;
  socketID: string;
  gameSettings: any;
  reconnectTimeout: NodeJS.Timeout | null = null;

  constructor(socket: Socket, platformData: any, gameSetting: any) {
    this.initializeUser(socket, platformData, gameSetting);
  }

  async initializeUser(socket: Socket, platformData: any, gameSetting: any) {
    try {
      if (!platformData) {
        throw new Error("Platform data is missing");
      }
      this.socketReady = true;
      this.platform = true;
      this.socketID = socket.id;
      this.username = platformData.username;
      this.role = platformData.role;
      this.credits = platformData.credits;
      this.gameSettings = gameSetting;

      socket.on(MESSAGEID.AUTH, this.initGameData);
      socket.emit("socketState", this.socketReady);

      console.log(
        `User ${this.username} initialized with socket ID: ${this.socketID}`
      );
    } catch (error) {
      console.error(`Error initializing user ${this.username}:`, error);
    }
  }

  initGameData = async (message: any) => {
    try {
      const messageData = JSON.parse(message);
      const tagName = messageData.Data.GameID;
      const platform = await Platform.aggregate([
        { $unwind: "$games" },
        { $match: { "games.tagName": tagName } },
        { $project: { _id: 0, game: "$games" } },
      ]);

      const game = platform[0].game;
      const payoutData = await Payouts.find({ _id: { $in: game.payout } });

      this.gameSettings = { ...payoutData[0].data };
      //   console.log(
      //     `Game settings initialized for user ${this.username}:`,
      //     this.gameSettings
      //   );
    } catch (error) {
      console.error(
        `Error initializing game data for user ${this.username}:`,
        error
      );
    }
  };

  setReconnectTimeout(callback: () => void) {
    this.reconnectTimeout = setTimeout(callback, RECONNECT_TIMEOUT);
    console.log(`Reconnect timeout set for user ${this.username}`);
  }

  clearReconnectTimeout() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
      console.log(`Reconnect timeout cleared for user ${this.username}`);
    }
  }
}

export default async function enterPlayer(socket: Socket) {
  try {
    const platformData = await getPlatformData(socket);
    const gameSetting = getGameSettings();

    if (!platformData.username || !platformData.role) {
      throw new Error("Invalid platform data");
    }

    const existingUser = users.get(platformData.username);
    if (existingUser) {
      existingUser.clearReconnectTimeout();
      existingUser.socketID = socket.id;
      await existingUser.initializeUser(socket, platformData, gameSetting);
      socket.emit(
        "reconnectSuccess",
        `Welcome back, ${platformData.username}!`
      );
      console.log(`Player ${platformData.username} reconnected.`);
    } else {
      socket.data = { platformData, gameSetting };
      const newUser = new SocketUser(socket, platformData, gameSetting);
      users.set(platformData.username, newUser);
      socket.emit("entrySuccess", `Welcome, ${platformData.username}!`);
      console.log(`Player ${platformData.username} entered the game.`);
    }

    socket.on("disconnect", async () => {
      await handleDisconnect(socket);
    });
  } catch (error) {
    console.error("Error during player entry:", error);
    socket.emit("entryError", "An error occurred during player entry.");
  }
}

async function getPlatformData(socket: Socket) {
  try {
    const decoded = await verifyPlayerToken(socket);
    const credits = await getPlayerCredits(decoded.username);
    return {
      username: decoded.username,
      role: decoded.role,
      credits: typeof credits === "number" ? credits : 0,
    };
  } catch (error) {
    throw new Error("Failed to get platform data: " + error.message);
  }
}

async function handleDisconnect(socket: Socket) {
  try {
    const platformData = await getPlatformData(socket); // Re-verify token upon disconnect
    socket.data.platformData = platformData;

    const username = platformData?.username;
    if (username && users.has(username)) {
      const user = users.get(username);
      if (user) {
        user.setReconnectTimeout(async () => {
          users.delete(username);
          console.log(`User ${username} was removed after reconnect timeout.`);
          socket.emit(
            "reconnectTimeout",
            `Reconnection timed out for ${username}.`
          );
        });
      }
      console.log(`User ${username} disconnected, waiting for reconnection.`);
      socket.emit(
        "disconnected",
        `You have been disconnected, ${username}. Attempting to reconnect...`
      );
    } else {
      console.log(`No user found with username ${username}.`);
    }
  } catch (error) {
    console.error("Error during handleDisconnect:", error);
  }
}

function getGameSettings() {
  // Retrieve game settings from a database or configuration file
  return {
    gameSetting: slotGameSettings,
  };
}
