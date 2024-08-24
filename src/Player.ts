import { Socket } from "socket.io";
import { verifyPlayerToken } from "./utils/playerAuth";
import { getPlayerCredits } from "./game/slotGames/gameUtils";
import { Platform } from "./dashboard/games/gameModel";
import { users } from "./socket";
import payoutController from "./dashboard/payouts/payoutController";
import SlotGame from "./game/slotGames/slotGame";
import { messageType } from "./game/slotGames/gameUtils";
import { gameData } from "./game/slotGames/testData";
export default class PlayerSocket {
    username: string;
    role: string;
    credits: number;
    userAgent: string;
    gameSocket: Socket | null;
    gameSettings: any;
    currentGame: SlotGame | null = null;
    heartbeatInterval: NodeJS.Timeout;
    reconnectionAttempts: number = 0;
    maxReconnectionAttempts: number = 1;
    reconnectionTimeout: number = 3000; // 5 seconds
    cleanedUp: boolean = false;
    constructor(username: string, role: string, credits: number, userAgent: string, gameSocket: Socket, public gameId: string) {
        this.username = username;
        this.role = role;
        this.credits = credits;
        this.userAgent = userAgent;
        this.gameSocket = gameSocket;
        this.initializeGameSocket(gameSocket)
    }

    initializeGameSocket(socket: Socket) {
        this.gameSocket = socket;
        this.cleanedUp = false;  // Reset the cleanup flag
        this.gameSocket.on("disconnect", () => this.handleGameDisconnection());
        this.initGameData();
        this.startHeartbeat();
        this.onExit();
        socket.emit("socketState", true);
    }

    handleGameDisconnection() {

        this.attemptReconnection();
    }

    async attemptReconnection() {
        try {
            while (this.reconnectionAttempts < this.maxReconnectionAttempts) {
                await new Promise(resolve => setTimeout(resolve, this.reconnectionTimeout));
                this.reconnectionAttempts++;

                if (this.cleanedUp) {

                    return;
                }

                if (this.gameSocket && this.gameSocket.connected) {

                    this.reconnectionAttempts = 0;
                    return;
                }


            }


            users.delete(this.username);
            this.cleanup();


        } catch (error) {

        }
    }

    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            if (this.gameSocket) {
                this.sendAlert(`I'm Alive ${this.username}`);
            }
        }, 20000); // 20 seconds
    }

    sendAlert(message: string) {
        if (this.gameSocket) {
            this.gameSocket.emit("alert", message);
        }
    }

    cleanup() {
        if (this.gameSocket) {
            this.gameSocket.disconnect(true);
            this.gameSocket = null;
        }
        clearInterval(this.heartbeatInterval);

        this.username = "";
        this.role = "";
        this.credits = 0;
        this.userAgent = "";
        this.gameSettings = null;
        this.currentGame = null;
        this.reconnectionAttempts = 0;

        this.cleanedUp = true; // Set the cleanup flag

    }

    onExit() {
        if (this.gameSocket) {
            this.gameSocket.on("EXIT", () => {
                users.delete(this.username);
                this.cleanup();


            });
        }


    }


    async updateGameSocket(socket: Socket) {
        if (socket.request.headers['user-agent'] !== this.userAgent) {
            socket.emit("alert", { id: "AnotherDevice", message: "You are already playing on another browser" });
            socket.disconnect(true);
            return;
        }
        this.initializeGameSocket(socket);
        const credits = await getPlayerCredits(this.username);
        this.credits = typeof credits === "number" ? credits : 0;
    }

    private async initGameData() {
        if (!this.gameSocket) return;

        try {

            const platform = await Platform.aggregate([
                { $unwind: "$games" },
                { $match: { "games.tagName": this.gameId, "games.status": "active" } },
                { $project: { _id: 0, game: "$games" } },
            ]);

            let payout = gameData[0];

            if (platform.length != 0) {
                const game = platform[0].game;
                // console.log("Payout 1 : ", game);

                payout = await payoutController.getPayoutVersionData(
                    game.tagName,
                    game.payout
                );
                // console.log("Payout : ",payout);
            }
          
            this.gameSettings = { ...payout };
            this.currentGame = new SlotGame(
                {
                    username: this.username,
                    credits: this.credits,
                    socket: this.gameSocket,
                },
                this.gameSettings
            );
        } catch (error) {
            console.error(`Error initializing game data for user ${this.username}`, error);
        }
    }
}




