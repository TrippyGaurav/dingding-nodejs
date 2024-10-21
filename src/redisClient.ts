import { message } from 'aws-sdk/clients/sns';
import Redis from 'ioredis';

export class RedisClient {
    private redis: Redis;
    private pub: Redis;
    private sub: Redis;

    constructor() {
        this.redis = new Redis(); // Create the Redis instance
        this.pub = new Redis();   // Create the Redis instance for publishing
        this.sub = new Redis();   // Create the Redis instance for subscribing
    }

    // Store user in Redis with platform-specific data
    public async setUser(username: string, platform: string, data: any): Promise<void> {
        const key = `activeUsers:${username}`;
        await this.redis.hset(key, platform, JSON.stringify(data));
    }

    // Remove a user's platform entry from Redis
    public async removeUser(username: string, platform: string): Promise<void> {
        const key = `activeUsers:${username}`;
        await this.redis.hdel(key, platform);
    }

    // Get all platforms of a users
    public async getUser(username: string): Promise<{ [key: string]: string }> {
        const key = `activeUsers:${username}`;
        return await this.redis.hgetall(key);
    }

    // Pub/Sub setup
    public subscribe(channel: string, callback: (message: string) => void): void {
        this.sub.subscribe(channel);
        this.sub.on('message', (ch, message) => {
            if (ch === channel) {
                callback(message);
            }
        })
    }

    public publish(channel: string, message: string): void {
        this.pub.publish(channel, message)
    }

}