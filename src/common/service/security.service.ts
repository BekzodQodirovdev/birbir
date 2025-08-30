import { Injectable } from '@nestjs/common';

export interface SecurityEvent {
  type: 'login_attempt' | 'login_success' | 'login_failure' | 'token_refresh' | 'suspicious_activity' | 'rate_limit_exceeded';
  userId?: string;
  ip?: string;
  userAgent?: string;
  details?: any;
  timestamp: Date;
}

@Injectable()
export class SecurityService {
  private securityLogs: SecurityEvent[] = [];

  logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date(),
    };

    this.securityLogs.push(securityEvent);

    // Keep only last 1000 events in memory
    if (this.securityLogs.length > 1000) {
      this.securityLogs = this.securityLogs.slice(-1000);
    }

    // Log to console for now (in production, this would go to a proper logging system)
    console.log(`[SECURITY] ${event.type}:`, {
      userId: event.userId,
      ip: event.ip,
      details: event.details,
    });
  }

  getSecurityLogs(limit: number = 100): SecurityEvent[] {
    return this.securityLogs.slice(-limit);
  }

  getFailedLoginAttempts(userId: string, timeWindowMinutes: number = 15): number {
    const timeWindow = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

    return this.securityLogs.filter(
      event =>
        event.type === 'login_failure' &&
        event.userId === userId &&
        event.timestamp > timeWindow,
    ).length;
  }

  getSuspiciousActivities(limit: number = 50): SecurityEvent[] {
    return this.securityLogs
      .filter(event => event.type === 'suspicious_activity')
      .slice(-limit);
  }

  // Rate limiting helpers
  private rateLimitStore = new Map<string, { count: number; resetTime: number }>();

  checkRateLimit(key: string, maxRequests: number, windowSeconds: number): boolean {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const resetTime = Math.floor(now / windowMs) * windowMs + windowMs;

    const current = this.rateLimitStore.get(key);

    if (!current || current.resetTime <= now) {
      this.rateLimitStore.set(key, { count: 1, resetTime });
      return true;
    }

    if (current.count >= maxRequests) {
      return false;
    }

    current.count++;
    return true;
  }

  getRateLimitInfo(key: string): { remaining: number; resetTime: number } | null {
    const current = this.rateLimitStore.get(key);
    if (!current) return null;

    const now = Date.now();
    if (current.resetTime <= now) {
      this.rateLimitStore.delete(key);
      return null;
    }

    return {
      remaining: Math.max(0, 10 - current.count), // Assuming 10 max requests
      resetTime: current.resetTime,
    };
  }
}