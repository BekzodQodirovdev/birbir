import { BaseModel } from 'src/common/database';
import { Column, Entity, Index } from 'typeorm';

/**
 * Telegram Session Entity
 * Represents a temporary session for Telegram authentication
 */
@Entity()
@Index(['sessionToken'], { unique: true })
export class TelegramSession extends BaseModel {
  /** Session token (UUID) */
  @Column({ type: 'varchar', length: 36, unique: true })
  sessionToken: string;

  /** Whether the session has been used */
  @Column({ type: 'boolean', default: false })
  isUsed: boolean;

  /** Whether the session has expired */
  @Column({ type: 'boolean', default: false })
  isExpired: boolean;

  /** Timestamp when the session expires */
  @Column({ type: 'timestamp' })
  expiresAt: Date;

  /** User's Telegram ID (filled when authentication is complete) */
  @Column({ type: 'varchar', length: 36, nullable: true })
  telegramId: string;

  /** User's name (filled when authentication is complete) */
  @Column({ type: 'varchar', length: 100, nullable: true })
  name: string;

  /** User's phone number (filled when authentication is complete) */
  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  /** User's username (filled when authentication is complete) */
  @Column({ type: 'varchar', length: 50, nullable: true })
  username: string;

  /** User's photo URL (filled when authentication is complete) */
  @Column({ type: 'varchar', length: 255, nullable: true })
  photo: string;
}