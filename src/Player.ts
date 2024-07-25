import { Socket } from "socket.io";
import { verifyPlayerToken } from "./utils/playerAuth";
import { getPlayerCredits } from "./game/Global";
import { Platform } from "./dashboard/games/gameModel";
import { Payouts } from "./dashboard/games/gameModel";

import SlotGame from "./dashboard/games/slotGame";
import { gameData } from "./game/slotBackend/testData";
import { users } from "./socket";


export default class Player {
    username: string;
    role: string;
    credits: number;
    socket: Socket;
    gameSettings: any;
    userAgent: string;

    socketReady: boolean = false;
    currentGame: SlotGame | null = null;
    platform: boolean;
    socketID: string;
    gameTag: string;

    heartbeatInterval: NodeJS.Timeout;
    reconnectionAttempts: number = 0;
    maxReconnectionAttempts: number = 3;
    reconnectionTimeout: number = 5000; // 5 seconds


    constructor(username: string, role: string, credits: number, userAgent: string, socket: Socket) {
        this.socketReady = false;
        this.currentGame = null;
        this.reconnectionAttempts = 0;
        this.maxReconnectionAttempts = 3;
        this.reconnectionTimeout = 5000; // 5 seconds

        this.username = username;
        this.credits = credits;
        this.role = role;
        this.socket = socket;
        this.userAgent = userAgent;

        if (socket) {
            this.initializeSocket(socket);
        }
    }

    initializeSocket(socket) {
        this.socket = socket;
        this.socketReady = true;
        this.disconnectHandler();
        this.startHeartbeat();
        this.onExit();
        this.initGameData();
        socket.emit("socketState", this.socketReady);
        console.log(`User ${this.username} initialized with socket ID: ${this.socket.id}`);
    }


    private initGameData() {
        this.socket.on("AUTH", async (message) => {
            try {
                const res = JSON.parse(message);
                const tagName = res.Data.GameID;

                const platform = await Platform.aggregate([
                    { $unwind: "$games" },
                    { $match: { "games.tagName": tagName, "games.status": 'active' } },
                    { $project: { _id: 0, game: "$games" } },
                ]);

                if (platform.length === 0) {
                    this.gameSettings = { ...gameData[0] }
                    new SlotGame({ username: this.username, credits: this.credits, socket: this.socket }, this.gameSettings);
                    return

                }
                const game = platform[0].game;
                const payoutData = await Payouts.find({ _id: { $in: game.payout } });

                this.gameSettings = { ...payoutData[0].data }
                this.currentGame = new SlotGame({ username: this.username, credits: this.credits, socket: this.socket }, this.gameSettings);

            } catch (error) {
                console.error(`Error initializing game data for user ${this.username}:`, error);
            }
        })
    }



    public sendAlert(message: string) {
        this.socket.emit("alert", message)
    }

    private startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            if (this.socket) {
                this.sendAlert(`I'm Alive ${this.username}`);
            }
        }, 20000); // 20 seconds
    }


    public disconnectHandler() {
        this.socket.on("disconnect", (reason) => {
            console.log(`User ${this.username} disconnected. Attempting to reconnect...`);

            this.attemptReconnection();
        });
    }

    private async attemptReconnection() {
        try {
            while (this.reconnectionAttempts < this.maxReconnectionAttempts) {
                await new Promise(resolve => setTimeout(resolve, this.reconnectionTimeout));
                this.reconnectionAttempts++;

                if (this.socket && this.socket.connected) {
                    console.log(`User ${this.username} reconnected successfully.`);
                    this.reconnectionAttempts = 0;
                    return;
                }

                console.log(`Reconnection attempt ${this.reconnectionAttempts} for user ${this.username}...`);
            }

            console.log(`User ${this.username} failed to reconnect after ${this.maxReconnectionAttempts} attempts.`);
            users.delete(this.username);
            this.cleanup();

            console.log("Curren tser : ", this.username);

            console.log("Map : ", users);
        } catch (error) {
            console.log("ERROR : Attempt to reconnect : ", error);
        }
    }

    private cleanup() {
        clearInterval(this.heartbeatInterval);

        // Nullify all properties to ensure the object is destroyed
        this.socket = null;
        this.username = null;
        this.role = null;
        this.credits = null;
        this.currentGame = null;
        this.platform = null;
        this.socketID = null;
        this.gameSettings = null;
        this.gameTag = null;
    }


    private onExit() {
        this.socket.on("exit", () => {
            users.delete(this.username)
            this.socket.disconnect();
            this.cleanup();
            console.log("User exited");

        })
    }

    public async updateSocket(socket: Socket) {
        this.socket = socket;
        this.socketID = socket.id;
        this.socketReady = true;
        this.disconnectHandler();
        this.startHeartbeat();
        this.onExit();



        try {
            const credits = await getPlayerCredits(this.username);
            this.credits = typeof credits === "number" ? credits : 0;

            // Reinitialize the game with the existing gameSettings and updated credits
            if (this.gameSettings && this.username) {
                this.currentGame = new SlotGame({ username: this.username, credits: this.credits, socket: this.socket }, this.gameSettings);
            }

        } catch (error) {
            console.error(`Error updating credits for user ${this.username}:`, error);
        }
    }
}



