import { BaseModel } from 'src/common/database';
import { Column, Entity, OneToMany, Index, ManyToOne } from 'typeorm';
import { Product } from './product.entity';
import { Region } from './region.entity';

@Entity()
@Index(['email'], { unique: true })
@Index(['phone_number'], { unique: true })
@Index(['telegram_id'], { unique: true })
export class User extends BaseModel {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 20, unique: true, nullable: true })
  phone_number: string;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password: string;

  @Column({ type: 'text', nullable: true })
  about: string;

  @Column({
    type: 'enum',
    enum: ['user', 'admin', 'moderator'],
    default: 'user',
  })
  role: string;

  /** Whether the user account is active */
  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  /** Whether the user has verified their identity */
  @Column({ type: 'boolean', default: false })
  is_verified: boolean;

  /** Timestamp of user's last activity */
  @Column({ type: 'timestamp', nullable: true })
  last_active: Date;

  // ==================== Profile Images ====================

  /** URL to user's profile photo */
  @Column({ type: 'varchar', length: 255, nullable: true })
  photo: string;

  /** URL to user's mobile banner image */
  @Column({ type: 'varchar', length: 255, nullable: true })
  banner_mobile: string;

  /** URL to user's desktop banner image */
  @Column({ type: 'varchar', length: 255, nullable: true })
  banner_desktop: string;

  /** URL to user's company logo */
  @Column({ type: 'varchar', length: 255, nullable: true })
  logo: string;

  // ==================== Business Information ====================

  /** Whether the user is a professional seller */
  @Column({ type: 'boolean', default: false })
  is_professional_seller: boolean;

  /** Name of the user's business */
  @Column({ type: 'varchar', length: 100, nullable: true })
  business_name: string;

  /** Type of business */
  @Column({ type: 'varchar', length: 50, nullable: true })
  business_type: string;

  /** City where the business is located */
  @Column({ type: 'varchar', length: 100, nullable: true })
  business_city: string;

  /** Category of the business */
  @Column({ type: 'varchar', length: 100, nullable: true })
  business_category: string;

  /** Business website URL */
  @Column({ type: 'varchar', length: 255, nullable: true })
  business_website: string;

  /** File path to user's passport document */
  @Column({ type: 'varchar', length: 255, nullable: true })
  passport_file: string;

  /** File path to user's business certificate */
  @Column({ type: 'varchar', length: 255, nullable: true })
  business_certificate_file: string;

  /** Status of professional seller application */
  @Column({
    type: 'enum',
    enum: ['pending', 'approved', 'rejected'],
    nullable: true,
  })
  professional_application_status: string;

  /** Notes about the professional application */
  @Column({ type: 'text', nullable: true })
  application_notes: string;

  /** Timestamp when the application was submitted */
  @Column({ type: 'timestamp', nullable: true })
  application_submitted_at: Date;

  /** Timestamp when the application was last reviewed */
  @Column({ type: 'timestamp', nullable: true })
  application_reviewed_at: Date;

  /** ID of the admin who reviewed the application */
  @Column({ type: 'varchar', length: 36, nullable: true })
  application_reviewed_by_id: string;

  /** Reason for application rejection */
  @Column({ type: 'text', nullable: true })
  application_rejection_reason: string;

  // ==================== Statistics ====================

  /** Total number of ads posted by the user */
  @Column({ type: 'int', default: 0 })
  total_ads: number;

  /** Number of subscribers the user has */
  @Column({ type: 'int', default: 0 })
  subscribers_count: number;

  /** Total number of ratings received */
  @Column({ type: 'int', default: 0 })
  ratings_count: number;

  /** Average rating score */
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  average_rating: number;

  // ==================== Engagement Statistics ====================
  /** Total shares by user */
  @Column({ type: 'int', default: 0 })
  total_shares: number;

  /** Total comments by user */
  @Column({ type: 'int', default: 0 })
  total_comments: number;

  /** Total reports by user */
  @Column({ type: 'int', default: 0 })
  total_reports: number;

  // ==================== Contact Preferences ====================

  /** Whether chat is enabled for the user */
  @Column({ type: 'boolean', default: true })
  chat_enabled: boolean;

  /** Whether phone calls are enabled for the user */
  @Column({ type: 'boolean', default: true })
  call_enabled: boolean;

  /** Whether Telegram integration is enabled */
  @Column({ type: 'boolean', default: false })
  telegram_enabled: boolean;

  /** User's Telegram username */
  @Column({ type: 'varchar', length: 50, nullable: true })
  telegram_username: string;

  // ==================== Social and Business Settings ====================

  /** Whether other ads are enabled for the user */
  @Column({ type: 'boolean', default: true })
  other_ads_enabled: boolean;

  /** Whether the user has a B2C business page */
  @Column({ type: 'boolean', default: false })
  b2c_business_page: boolean;

  /** Whether the user is currently online */
  @Column({ type: 'boolean', default: false })
  is_online: boolean;

  /** Timestamp of user's last seen activity */
  @Column({ type: 'timestamp', nullable: true })
  last_seen: Date;

  /** Type of seller (individual, business, etc.) */
  @Column({ type: 'varchar', length: 50, nullable: true })
  seller_type: string;

  /** Unique Telegram ID for the user */
  @Column({ type: 'varchar', length: 36, unique: true, nullable: true })
  telegram_id: string;

  /** Current status of the user account */
  @Column({
    type: 'enum',
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
  })
  status: string;

  // ==================== Social Network Integration ====================

  /** Type of social network account used for login */
  @Column({ type: 'varchar', length: 50, nullable: true })
  social_network_account_type: string; // 'telegram'

  /** External social network user ID */
  @Column({ type: 'varchar', length: 255, nullable: true })
  social_network_id: string;

  // ==================== Authentication Fields ====================

  /** Whether email is verified */
  @Column({ type: 'boolean', default: false })
  email_verified: boolean;

  /** Token for password reset */
  @Column({ type: 'varchar', length: 255, nullable: true })
  password_reset_token: string;

  /** Expiration time for password reset token */
  @Column({ type: 'timestamp', nullable: true })
  password_reset_expires: Date;

  /** Refresh token for session management */
  @Column({ type: 'text', nullable: true })
  refresh_token: string;

  /** Refresh token expiration time */
  @Column({ type: 'timestamp', nullable: true })
  refresh_token_expires: Date;

  /** Timestamp of last login */
  @Column({ type: 'timestamp', nullable: true })
  last_login_at: Date;

  /** Number of failed login attempts */
  @Column({ type: 'int', default: 0 })
  login_attempts: number;

  /** Account lockout expiration time */
  @Column({ type: 'timestamp', nullable: true })
  locked_until: Date;

  // ==================== Relationships ====================

  /** User's selected region */
  @ManyToOne(() => Region, (region) => region.users, { nullable: true })
  region: Region;

  /** Products created by this user */
  @OneToMany(() => Product, (product) => product.created_by)
  products: Product[];
}
