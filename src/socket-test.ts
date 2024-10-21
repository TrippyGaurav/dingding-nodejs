import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";

import { UserManager } from "./dashboard/users/userManager";
import { config } from "./config/config";
import { RedisClient } from "./redisClient";
import createHttpError from "http-errors";


interface DecodedToken {
    username: string;
    role?: string;
}

export class SocketServer {
    private io: Server;
    private userManager: UserManager;

    constructor(io: Server) {
        this.io = io;
        this.userManager = new UserManager();

        // Subscribe to Redis Pub/Sub for cross-instance user status updates
        this.userManager.subscribeToStatusChannel((message) => {
            const { username, status } = JSON.parse(message);
            console.log(`${username} is now ${status}`);
        });

        // Setup middlware and event listeners
        this.setupMiddleware();
        this.setupConnection();
    }

    // Middleware for token verification
    private setupMiddleware(): void {
        this.io.use(async (socket: Socket, next) => {
            const token = socket.handshake.auth.token;
            const platform = socket.handshake.auth.platform || 'unknown';
            const userAgent = socket.request.headers['user-agent'];

            try {
                const decoded = await this.verifyToken(token);
                const credits = await this.userManager.getUserCredits(decoded.username)
                socket.data = { username: decoded.username, platform, credits, userAgent };

                // Add user to UserManager
                await this.userManager.addUser(decoded.username, platform, socket.id, userAgent);

                // Notify other users about status change
                this.userManager.broadcastStatus(decoded.username, 'online');

                next();
            } catch (error) {
                console.error('Authentication error : ', error.message);
                next(new Error("Authentication failed"))
            }

        })
    }

    // Handle new connections and disconnections
    private setupConnection(): void {
        this.io.on('connection', async (socket: Socket) => {
            try {
                const { username, platform, userAgent } = socket.data;
                const gameTag = socket.handshake.auth.gameId;

                if (!username) {
                    console.error('Connection request: missing required fields in token');
                    socket.disconnect(true);
                    return;
                }

                // Check if the user is already connected from another device/browser
                const existingUser = await this.userManager.getUser(username);

                if (existingUser && existingUser[platform]) {
                    const existingSocketId = JSON.parse(existingUser[platform]).socketId;
                    if (existingSocketId != socket.id) {
                        // User is already connected on another device or browser
                        socket.emit('AnotherDevice', 'You are already playing on another browser or device.');
                        socket.disconnect(true);
                        throw createHttpError(403, 'Please wait to disconnect');
                    }
                }
            } catch (error) {

            }
            const { username, platform } = socket.data;
            const userAgent = socket.data.userAgent;
            const gameTag = socket.handshake.auth.gameId;

            if (!username) {
                console.error('Connection request : missing required fields in token');
                socket.disconnect(true);
                return;
            }

            // Check if the user is already connected from another device
            const existingUser = await this.userManager.getUser(username);
            if (existingUser && existingUser[platform]) {
                const existingSocketId = JSON.parse(existingUser[platform]).socketId;
                if (existingSocketId !== socket.id) {
                    socket.emit('AnotherDevice', 'You are already connected on another device or browser.');
                    socket.disconnect(true);
                    return;
                }
            }

            // Handle disconnections
            socket.on('disconnect', async () => {
                console.log(`${username} disconnected from ${platform}`);
                await this.userManager.removeUser(username, platform);
                this.userManager.broadcastStatus(username, 'offline')
            });

            // Example: Private message between users
            socket.on('privateMessage', async (targetUsername, message) => {
                const targetUser = await this.userManager.getUser(targetUsername);
                if (targetUser) {
                    const targetSocketId = JSON.parse(targetUser['web']).socketId; // Example: 'web' platform
                    this.io.to(targetSocketId).emit('privateMessage', { from: username, message });
                } else {
                    console.log(`User ${targetUsername} is not online`);
                }
            });
        })

    }

    private verifyToken(socket: Socket): Promise<DecodedToken> {
        return new Promise((resolve, reject) => {
            const token = socket.handshake.auth.token;
            if (!token) {
                reject(new Error("No authentication token provided"));
            }

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
        })
    }

}