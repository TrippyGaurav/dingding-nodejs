import { Socket } from "socket.io";
import { MESSAGEID, MESSAGETYPE } from "../utils/utils";
import { verifyPlayerToken } from "../utils/playerAuth";
import { Player } from "../dashboard/users/userModel";
export let users: Map<string, SocketUser> = new Map();
import { gameData } from "../game/slotBackend/testData";
import { GAMETYPE } from "../game/Utils/globalTypes";
import { slotMessages } from "../game/slotBackend/slotMessages";
import { slotGameSettings } from "../game/slotBackend/_global";
import { kenoMessages } from "../game/kenoBackend/kenoMessages";
import { Platform } from "../dashboard/games/gameModel";
import Payouts from "../dashboard/payouts/payoutModel";
import { GData, PlayerData } from "../game/TestGlobal";



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
                slotGameSettings.initiate(this.socket, gameData[0], this.socket.id);
                return;
            }

            const payout = await Payouts.findById(game.payout);
            if (!payout) {
                throw new Error(`Payout not found for game ${game.name}`);
            }

            // Assuming you need the first element's data from the content array
            if (payout.content.length === 0) {
                throw new Error(`No payout content found for game ${game.name}`);
            }

            const firstPayoutContent = payout.content[0];

            const gameType = tagName.split('-');
            this.gameTag = gameType[0];
            if (gameType == GAMETYPE.SLOT)
                console.log('SLOT INITITATED')
            slotGameSettings.initiate(this.socket, firstPayoutContent.data, this.socket.id);
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

    heartbeat = () => {
        this.isAlive = true;
    };


    messageHandler = () => {
        return (message: any) => {
            const messageData = JSON.parse(message);
            console.log("message " + JSON.stringify(messageData));
            if (this.gameTag == GAMETYPE.SLOT)
                slotMessages(this.socket, this.socket.id, messageData);
            if (this.gameTag == GAMETYPE.KENO)
                kenoMessages(this.socket, messageData);
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
                // console.log(this.username);
                // console.log("Player Balance users", CurrentUser.credits);
                sendMessage(this.socket, MESSAGEID.AUTH, CurrentUser.credits);
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
            sendMessage(this.socket, "low-balance", true)
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
        const decoded = await verifyPlayerToken(socket);
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
    skt.emit(MESSAGETYPE.ALERT, message);
}

export function sendMessage(skt: Socket, id: string, message: any) {
    skt.emit(MESSAGETYPE.MESSAGE, JSON.stringify({ id, message }));
}


export const betMultiplier = [0.1, 0.25, 0.5, 0.75, 1];



