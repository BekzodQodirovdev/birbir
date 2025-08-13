import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { User } from 'src/core/entity/user.entity';
import { TelegramSession } from './telegram-session.entity';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { TelegramWebsocketGateway } from './telegram-websocket.gateway';

@Injectable()
export class TelegramAuthService {
  private readonly logger = new Logger(TelegramAuthService.name);

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(TelegramSession)
    private readonly sessionRepository: Repository<TelegramSession>,
    private readonly authService: AuthService,
    private readonly websocketGateway: TelegramWebsocketGateway,
  ) {}

  /**
   * Create a new Telegram authentication session
   * @returns sessionToken
   */
  async createSession(): Promise<string> {
    const sessionToken = uuidv4();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes from now

    const session = this.sessionRepository.create({
      sessionToken,
      expiresAt,
      isUsed: false,
      isExpired: false,
    });

    await this.sessionRepository.save(session);
    this.logger.log(`Created new Telegram session: ${sessionToken}`);
    return sessionToken;
  }

  /**
   * Validate a session token
   * @param sessionToken
   * @returns TelegramSession if valid, null if invalid
   */
  async validateSession(sessionToken: string): Promise<TelegramSession | null> {
    const session = await this.sessionRepository.findOne({
      where: { sessionToken },
    });

    if (!session) {
      return null;
    }

    // Check if session is expired
    if (session.isExpired || session.expiresAt < new Date()) {
      await this.sessionRepository.update(session.id, { isExpired: true });
      return null;
    }

    // Check if session is already used
    if (session.isUsed) {
      return null;
    }

    return session;
  }

  /**
   * Complete Telegram authentication
   * @param sessionToken
   * @param userData
   * @returns JWT token
   */
  async completeAuthentication(
    sessionToken: string,
    userData: {
      name: string;
      phone: string;
      telegramId: string;
      username: string;
      photo: string;
    },
  ): Promise<string> {
    try {
      // Validate session
      const session = await this.validateSession(sessionToken);
      if (!session) {
        // Send error via WebSocket
        this.websocketGateway.sendAuthError(sessionToken, 'Invalid or expired session token');
        throw new UnauthorizedException('Invalid or expired session token');
      }

      // Update session with user data
      await this.sessionRepository.update(session.id, {
        name: userData.name,
        phone: userData.phone,
        telegramId: userData.telegramId,
        username: userData.username,
        photo: userData.photo,
        isUsed: true,
      });

      // Create or find user
      let user = await this.userRepository.findOne({
        where: { telegram_id: userData.telegramId },
      });

      if (!user) {
        // Create new user
        const createAuthDto: CreateAuthDto = {
          name: userData.name,
          telegram_username: userData.username,
          photo: userData.photo,
          social_network_account_type: 'telegram',
          social_network_id: userData.telegramId,
          telegram_id: userData.telegramId,
          first_name: userData.name,
          username: userData.username,
          photo_url: userData.photo,
        };

        const result = await this.authService.socialLogin(createAuthDto);
        user = result as User;
      } else {
        // Update existing user with new data
        user.name = userData.name;
        user.telegram_username = userData.username;
        user.photo = userData.photo;
        await this.userRepository.save(user);
      }

      // Generate JWT token
      const jwt = this.authService.generateJwt(user);
      this.logger.log(`Completed Telegram authentication for user: ${user.id}`);

      // Send JWT via WebSocket
      this.websocketGateway.sendAuthResult(sessionToken, jwt);

      return jwt;
    } catch (error) {
      this.logger.error('Error completing Telegram authentication', error);
      // Send error via WebSocket
      this.websocketGateway.sendAuthError(sessionToken, error.message || 'Authentication failed');
      throw error;
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<void> {
    const now = new Date();
    await this.sessionRepository.update(
      { expiresAt: LessThan(now), isExpired: false },
      { isExpired: true },
    );
    this.logger.log('Cleaned up expired Telegram sessions');
  }
}