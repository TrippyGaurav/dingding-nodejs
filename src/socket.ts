import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { Player as PlayerModel } from "./dashboard/users/userModel";
import { config } from "./config/config";
import Player from "./Player";
import createHttpError from "http-errors";


interface DecodedToken {
    username: string;
    role?: string;
}

export let users: Map<string, Player> = new Map();


const verifySocketToken = (socket: Socket): Promise<DecodedToken> => {
    return new Promise((resolve, reject) => {
        const token = socket.handshake.auth.token;
        if (token) {
            jwt.verify(token, config.jwtSecret, (err, decoded) => {
                if (err) {
                    console.error("Token verification failed:", err.message);
                    reject(new Error("You are not authenticated"));
                } else if (!decoded || !decoded.username) {
                    reject(new Error("Token does not contain required fields"));
                } else {
                    resolve(decoded as DecodedToken);
                }
            });
        } else {
            reject(new Error("No authentication token provided"));
        }
    });
};

const getUserCredits = async (username: string): Promise<number> => {
    const player = await PlayerModel.findOne({ username });
    if (player) {
        return player.credits;
    }
    throw new Error("User not found");
};

const socketController = (io: Server) => {

    // Token verification middleware
    io.use(async (socket: Socket, next: (err?: Error) => void) => {
        const userAgent = socket.request.headers['user-agent'];
        try {
            const decoded = await verifySocketToken(socket);
            const credits = await getUserCredits(decoded.username);

            (socket as any).decoded = { ...decoded, credits };
            (socket as any).userAgent = userAgent;
            next();
        } catch (error) {
            console.error("Authentication error:", error.message);
            next(error);
        }
    });

    io.on("connection", async (socket) => {
        try {
            const decoded = (socket as any).decoded;
            const origin = socket.handshake.auth.origin;
            const gameId = socket.handshake.auth.gameId;


            if (!decoded || !decoded.username || !decoded.role) {
                console.error("Connection rejected: missing required fields in token");
                socket.disconnect(true);
                return;
            }


            const userAgent = (socket as any).userAgent;
            const username = decoded.username;

            const existingUser = users.get(username);

            if (existingUser) {
                if (existingUser.playerData.userAgent !== userAgent) {
                    socket.emit("AnotherDevice", "You are already playing on another browser.");
                    socket.disconnect(true);
                    throw createHttpError(403, "Please wait to disconnect")
                }

                // Ensure the user has a platform connection before allowing a game connection
                if (!existingUser.platformData.socket) {
                    socket.emit("Error", "You need to have an active platform connection before joining a game.");
                    socket.disconnect(true);
                    return;
                }

                // If gameId is provided, this is a request for a game connection
                if (gameId) {
                    await existingUser.updateGameSocket(socket); // Initialize or update the game socket
                    existingUser.sendAlert(`Game initialized for ${username} in game ${gameId}`);
                }

                // If no gameId is provided, just confirm platform connection
                existingUser.sendAlert(`Platform connection for ${username} is already active.`);
                return;
            }

            // If no existing user, this is a new connection
            if (origin) {
                // Platform connection :  Only initialze the player, no game initialization
                const newUser = new Player(username, decoded.role, decoded.credits, userAgent, socket);
                users.set(username, newUser);
                newUser.sendAlert(`Player initialized for ${newUser.playerData.username} on platform ${origin}`, false);
                return;
            }
            else {
                // Reject game connection without an active platform connection
                socket.emit("Error", "You need to have an active platform connection before joining a game.");
                socket.disconnect(true);
            }

        } catch (error) {
            console.error("An error occurred during socket connection:", error.message);
            if (socket.connected) {
                socket.disconnect(true);
            }
        }
    });

    // Error handling middleware
    io.use((socket: Socket, next: (err?: Error) => void) => {
        socket.on('error', (err: Error) => {
            console.error('Socket Error:', err);
            socket.disconnect(true);
        });
        next();
    });
};

export default socketController;
