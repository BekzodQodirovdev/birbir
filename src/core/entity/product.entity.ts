import { BaseModel } from 'src/common/database';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { ProductImage } from './product-image.entity';

@Entity()
export class Product extends BaseModel {
  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'enum', enum: ['new', 'used'], default: 'new' })
  condition: string;

  @Column({ type: 'boolean', default: false })
  is_negotiable: boolean;

  @Column({ type: 'boolean', default: false })
  is_urgent: boolean;

  @Column({ type: 'boolean', default: false })
  is_free: boolean;

  @Column({ type: 'boolean', default: false })
  has_delivery: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  subcategory: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  location: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ type: 'int', default: 0 })
  views_count: number;

  @Column({ type: 'int', default: 0 })
  favorites_count: number;

  // Engagement statistics
  @Column({ type: 'int', default: 0 })
  likes_count: number;

  @Column({ type: 'int', default: 0 })
  calls_count: number;

  @Column({ type: 'int', default: 0 })
  contacts_count: number;

  // Advertising system
  @Column({ type: 'boolean', default: false })
  is_premium: boolean;

  @Column({ type: 'boolean', default: false })
  is_promoted: boolean;

  @Column({ type: 'timestamp', nullable: true })
  promotion_start_date: Date;

  @Column({ type: 'timestamp', nullable: true })
  promotion_end_date: Date;

  @Column({ type: 'varchar', length: 50, nullable: true })
  promotion_type: string; // 'maxi', 'premium', 'urgent'

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  promotion_price: number;

  @Column({ type: 'int', nullable: true })
  promotion_duration_days: number;

  @Column({ type: 'boolean', default: false })
  has_large_photo: boolean;

  @Column({ type: 'boolean', default: false })
  has_premium_badge: boolean;

  @Column({ type: 'boolean', default: false })
  has_photo_gallery: boolean;

  @Column({ type: 'boolean', default: false })
  has_direct_contacts: boolean;

  @Column({ type: 'varchar', length: 20, nullable: true })
  listing_id: string; // E'lon raqami (masalan: 88886176)

  @Column({ type: 'varchar', length: 255, nullable: true })
  slug: string; // URL-friendly version of the product name

  // Draft/Published status tracking
  @Column({ type: 'int', default: 500 })
  status: number; // Numeric status code

  @Column({ type: 'varchar', length: 50, default: 'draft' })
  tab: string; // Current tab/status (draft, published, etc.)

  @Column({ type: 'timestamp', nullable: true })
  should_expired_at: Date; // When the product should expire

  @Column({ type: 'timestamp', nullable: true })
  first_published_at: Date; // When the product was first published

  @Column({ type: 'boolean', default: false })
  publishable: boolean; // Whether the product can be published

  // Additional status tracking fields
  @Column({ type: 'varchar', length: 255, nullable: true })
  status_reason: string; // Reason for current status

  @Column({ type: 'text', nullable: true })
  rejected_reason: string; // Reason for rejection (if applicable)

  @Column({ type: 'timestamp', nullable: true })
  submitted_for_review_at: Date; // Timestamp when submitted for review

  @Column({ type: 'timestamp', nullable: true })
  last_reviewed_at: Date; // Timestamp of last review

  @Column({ type: 'varchar', length: 36, nullable: true })
  reviewed_by_id: string; // ID of moderator who last reviewed

  // Validation issues tracking
  @Column({ type: 'text', nullable: true })
  issues: string; // Validation issues as JSON

  @Column({ type: 'varchar', length: 255, nullable: true })
  web_uri: string; // Web URI for the product

  @Column({ type: 'text', nullable: true })
  payload: string; // Additional payload data as JSON

  @Column({ type: 'text', nullable: true })
  promotion_data: string; // Promotion related data as JSON

  @Column({ type: 'text', nullable: true })
  statistics: string; // Statistics data as JSON

  @Column({ type: 'text', nullable: true })
  notice_top: string; // Notice at the top

  @Column({ type: 'text', nullable: true })
  notice_bottom: string; // Notice at the bottom

  @Column({ type: 'boolean', default: false })
  delivery_enabled: boolean; // Whether delivery is enabled

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  gross_price: number; // Gross price

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  gross_price_discount: number; // Gross price discount

  @Column({ type: 'text', nullable: true })
  badges: string; // Badges for the product as JSON

  // Promotion history and analytics
  @Column({ type: 'text', nullable: true })
  promotion_history: string; // JSON array of promotion records

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total_promotion_spent: number; // Total amount spent on promotions

  @Column({ type: 'timestamp', nullable: true })
  last_promotion_at: Date; // Timestamp of last promotion

  @Column({ type: 'int', default: 0 })
  promotion_views_count: number; // Total views during promotion periods

  @Column({ type: 'int', default: 0 })
  promotion_likes_count: number; // Total likes during promotion periods

  @Column({ type: 'int', default: 0 })
  promotion_calls_count: number; // Total calls during promotion periods

  @Column({ type: 'int', default: 0 })
  promotion_contacts_count: number; // Total contacts during promotion periods

  @Column({ type: 'int', default: 0 })
  promotion_favorites_count: number; // Total favorites during promotion periods

  // Enhanced engagement tracking
  @Column({ type: 'text', nullable: true })
  engagement_history: string; // JSON array of engagement events

  @Column({ type: 'int', default: 0 })
  shares_count: number; // Total shares count

  @Column({ type: 'int', default: 0 })
  comments_count: number; // Total comments count

  @Column({ type: 'int', default: 0 })
  reports_count: number; // Total reports count

  @Column({ type: 'text', nullable: true })
  daily_engagement_stats: string; // JSON object for daily stats

  @Column({ type: 'text', nullable: true })
  weekly_engagement_stats: string; // JSON object for weekly stats

  @Column({ type: 'text', nullable: true })
  monthly_engagement_stats: string; // JSON object for monthly stats

  @ManyToOne(() => User, (user) => user.products)
  created_by: User;

  @Column()
  created_by_id: string;

  @OneToMany(() => ProductImage, (image) => image.product, { cascade: true })
  images: ProductImage[];
}
