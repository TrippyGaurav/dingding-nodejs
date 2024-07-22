import jwt from "jsonwebtoken";
import { config } from "./config/config";
import { Player } from "./dashboard/users/userModel";
import { Payouts, Platform } from "./dashboard/games/gameModel";
import SlotGame from "./dashboard/games/slotGame";
import { gameCategory } from "./dashboard/games/gameUtils";

interface DecodedToken {
    username: string; // Adjust according to the actual fields in your token
    role: string;
    exp: number;  // Include expiration timestamp
    iat: number;  // Include issued at timestamp
}

const verifyToken = (token: string): { decoded: DecodedToken | null; verified: boolean } => {
    try {
        const decodedToken = jwt.decode(token) as DecodedToken;
        const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds

        if (decodedToken.exp < currentTime) {
            console.log('Token has expired');
            return { decoded: decodedToken, verified: false };
        }

        // Verify the token's signature
        jwt.verify(token, config.jwtSecret);
        return { decoded: decodedToken, verified: true };
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            console.log('Token has expired');
        } else {
            console.log('Invalid token');
        }
        return { decoded: null, verified: false };
    }
};

export const socketController = (io) => {

    io.on("connection", async (socket) => {
        console.log('a user connected');
        const token = socket.handshake.auth.token;

        const socketPlayer = {
            username: null,
            credits: 0,
            socket: socket
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
                    socketPlayer.username = player.username;
                    socketPlayer.credits = player.credits;

                    console.log('User found in the database:', socketPlayer.username, socketPlayer.credits);
                }
                console.log("VERIFIED ");

            } catch (error) {
                console.error('Error fetching user from database:', error);
                socket.emit('error', 'Internal server error');
                socket.disconnect();
                return;
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

                const gameType = tagName.split('-');

                console.log("Game Type : ", gameType);


                switch (gameType[0]) {
                    case gameCategory.SLOT:
                        const currentGame = new SlotGame(socketPlayer, payoutData[0].data);
                        console.log("Current Game : ", currentGame);

                        break;

                    case gameCategory.KENO:
                        console.log("KENO GAME");

                    default:
                        console.log("Unknown game type");
                        socket.emit('error', 'Unknown game type');
                }

            } catch (error) {
                console.error('Error processing AUTH message:', error);
                socket.emit('error', 'Error processing AUTH message');
            }
        })

    })
}

