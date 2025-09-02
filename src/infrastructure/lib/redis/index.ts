import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    this.client.on('connect', () => {
      console.log('Connected to Redis');
    });
  }

  async onModuleInit() {
    await this.client.connect();
  }

  async onModuleDestroy() {
    await this.client.disconnect();
  }

  // Session management methods
  async setSession(sessionToken: string, data: any, ttlSeconds: number = 3600): Promise<void> {
    const key = `session:${sessionToken}`;
    await this.client.setEx(key, ttlSeconds, JSON.stringify(data));
  }

  async getSession(sessionToken: string): Promise<any | null> {
    const key = `session:${sessionToken}`;
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  async deleteSession(sessionToken: string): Promise<void> {
    const key = `session:${sessionToken}`;
    await this.client.del(key);
  }

  async getUserSessions(userId: string): Promise<string[]> {
    const pattern = `session:*`;
    const keys = await this.client.keys(pattern);
    const userSessions: string[] = [];

    for (const key of keys) {
      const data = await this.client.get(key);
      if (data) {
        try {
          const sessionData = JSON.parse(data);
          if (sessionData.userId === userId) {
            userSessions.push(key.replace('session:', ''));
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }

    return userSessions;
  }

  async deleteUserSessions(userId: string): Promise<void> {
    const userSessions = await this.getUserSessions(userId);
    for (const sessionToken of userSessions) {
      await this.deleteSession(sessionToken);
    }
  }

  // Security monitoring methods
  async logSecurityEvent(event: {
    type: string;
    userId?: string;
    ip?: string;
    userAgent?: string;
    details?: any;
    timestamp?: Date;
  }): Promise<void> {
    const logEntry = {
      ...event,
      timestamp: event.timestamp || new Date(),
    };

    const key = `security:logs:${Date.now()}`;
    await this.client.setEx(key, 30 * 24 * 60 * 60, JSON.stringify(logEntry)); // 30 days
  }

  async getSecurityLogs(limit: number = 100): Promise<any[]> {
    const pattern = `security:logs:*`;
    const keys = await this.client.keys(pattern);
    const logs: any[] = [];

    // Sort keys by timestamp (newest first)
    keys.sort((a, b) => parseInt(b.split(':')[2]) - parseInt(a.split(':')[2]));

    for (const key of keys.slice(0, limit)) {
      const data = await this.client.get(key);
      if (data) {
        try {
          logs.push(JSON.parse(data));
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }

    return logs;
  }

  // Rate limiting methods
  async incrementRateLimit(key: string, windowSeconds: number = 60): Promise<number> {
    const count = await this.client.incr(key);
    if (count === 1) {
      await this.client.expire(key, windowSeconds);
    }
    return count;
  }

  async getRateLimit(key: string): Promise<number> {
    const count = await this.client.get(key);
    return count ? parseInt(count) : 0;
  }

  async resetRateLimit(key: string): Promise<void> {
    await this.client.del(key);
  }
}