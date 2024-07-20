import { Socket } from "socket.io";
import { slotGameSettings } from "./game/slotBackend/_global";
import { verifyPlayerToken } from "./utils/playerAuth";
import { getPlayerCredits } from "./game/Global";
import { MESSAGEID } from "./utils/utils";
import { Platform } from "./dashboard/games/gameModel";
import { Payouts } from "./dashboard/games/gameModel";
import { gameData } from "./game/slotBackend/testData";
export let users: Map<string, SocketUser> = new Map();
export class SocketUser {
    socketReady: boolean = false;
    username: string;
    role: string;
    credits: number;
    currentGame: {};
    platform: boolean;
    socketID: string
    gameSettings: any;
    constructor(socket: Socket) {
        this.socketReady = true;
        const { platformData, gameSetting } = socket.data;
        this.platform = true;
        this.socketID = platformData.username
        this.username = platformData.username;
        this.role = platformData.role;
        this.credits = platformData.credits;
        this.gameSettings = gameSetting;
        socket.on(MESSAGEID.AUTH, this.initGameData);
        socket.emit('socketState', this.socketReady)

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
            const payoutData = await Payouts.find({ _id: { $in: game.payout } });

            this.gameSettings = { ...payoutData[0].data };
            console.log(this.gameSettings)
        } catch (error) {
            console.error('Error initializing game data:', error);
        }
    };
}

export default async function enterPlayer(socket: Socket) {
    try {
        const platformData = await getPlatformData(socket);
        const gameSetting = getGameSettings();
        if (!platformData.username || !platformData.role) {
            throw new Error('Invalid platform data');
        }
        if (users.has(platformData.username)) {
            console.log(`Player ${platformData.username} is already in a game.`);
            return;
        }
        socket.data = { platformData, gameSetting };
        const newUser = new SocketUser(socket);
        users.set(platformData.username, newUser);
        console.log(`Player ${platformData.username} entered the game.`);
        socket.on('disconnect', () => {
            deleteUserFromMap(socket);
        });
    } catch (error) {
        console.error('Error during player entry:', error);
    }
}

async function getPlatformData(socket: Socket) {
    try {
        const decoded = await verifyPlayerToken(socket);
        const credits = await getPlayerCredits(decoded.username);
        return {
            username: decoded.username,
            role: decoded.role,
            credits: typeof credits === 'number' ? credits : 0
        };
    } catch (error) {
        throw new Error('Failed to get platform data: ' + error.message);
    }
}

function deleteUserFromMap(socket: Socket) {
    const username = socket.data?.platformData?.username;
    if (username && users.has(username)) {
        users.delete(username);
        console.log(`User ${username} was successfully removed.`);
    } else {
        console.log(`No user found with username ${username}.`);
    }
}

function getGameSettings() {
    return {
        gameSetting: { }
    };
}
