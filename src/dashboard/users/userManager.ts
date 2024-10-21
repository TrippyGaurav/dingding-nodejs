import { RedisClient } from "../../redisClient";
import { Player as PlayerModel } from "./userModel";

export class UserManager {
    private redisClient: RedisClient;

    constructor() {
        this.redisClient = new RedisClient();
    }

    // Add user to Redis
    public async addUser(username: string, platform: string, socketId: string, userAgent: string): Promise<void> {
        const userData = { socketId, userAgent };
        await this.redisClient.setUser(username, platform, userData);
    }

    // Remove user from Redis by platform
    public async removeUser(username: string, platform: string): Promise<void> {
        await this.redisClient.removeUser(username, platform);
    }

    // Get user's connections across platforms
    public async getUser(username: string): Promise<{ [key: string]: string }> {
        return await this.redisClient.getUser(username);
    }

    public async getUserCredits(username: string): Promise<number> {
        const player = await PlayerModel.findOne({ username }, 'credits');
        return player?.credits ?? Promise.reject(new Error("User not found"))
    }

    // Notify users about status changes (online/offline)
    public broadcastStatus(username: string, status: string): void {
        // Broadcast to all instances or clients via Redis Pub/Sub
        this.redisClient.publish('userStatusChannel', JSON.stringify({ username, status }));
    }

    // Subscribe to user status channel
    public subscribeToStatusChannel(callback: (message: string) => void): void {
        this.redisClient.subscribe('userStatusChannel', callback);
    }
}