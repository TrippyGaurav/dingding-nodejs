import jwt from "jsonwebtoken";
import { config } from "./config/config";
import { Player } from "./dashboard/users/userModel";
import { Payouts, Platform } from "./dashboard/games/gameModel";
import SlotGame from "./dashboard/games/slotGame";
import { GameSettings } from "./dashboard/games/gameType";

interface DecodedToken {
    username: string; // Adjust according to the actual fields in your token
    role: string;
}

export const socketController = (io) => {

    io.on("connection", async (socket) => {
        console.log('a user connected');
        const token = socket.handshake.auth.token;
        const player = {
            username: null,
            credits: 0,
            socket: null
        }

        const { decoded, verified } = verifyToken(token);
        if (!verified) {
            socket.emit('error', 'Authentication error: Invalid or expired token');
            socket.disconnect();
            return;
        } else {
            const { username, role } = decoded as DecodedToken;
            console.log("AUTHENTICATED :", username, role);

            try {
                const player = await Player.findOne({ username }).exec();
                if (!player) {
                    console.log('error : Authentication error: User not found');
                    socket.emit('error', 'Authentication error: User not found');
                    socket.disconnect();
                    return;
                } else {
                    const { username, role, credits } = player;
                    console.log('User found in the database:', username, role, credits);
                }
            } catch (error) {
                console.log(error);

            }

        }

        socket.on("AUTH", async (message) => {
            console.log('Received AUTH message:', message);

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

                if (platform.length === 0) {
                    console.log('Game not found');
                    socket.emit('error', 'Game not found');
                    return;
                }


                const game = platform[0].game;
                const payoutData = await Payouts.find({ _id: { $in: game.payout } });




                const currentGame = new SlotGame(player, gameSettings);
                console.log("Current Game : ", currentGame);





            } catch (error) {
                console.error('Error processing AUTH message:', error);
                socket.emit('error', 'Error processing AUTH message');
            }
        })

    })
}

const verifyToken = (token: string): { decoded: DecodedToken | null; verified: DecodedToken | null } => {
    try {
        const decodedToken = jwt.decode(token) as DecodedToken;
        // Verify the token's signature
        const verifiedToken = jwt.verify(token, config.jwtSecret) as DecodedToken;
        return { decoded: decodedToken, verified: verifiedToken };
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            console.log('Token has expired');
        } else {
            console.log('Invalid token');
        }
        return { decoded: null, verified: null };
    }
};