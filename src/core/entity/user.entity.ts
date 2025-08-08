import { BaseModel } from 'src/common/database';
import { Column, Entity, OneToMany } from 'typeorm';
import { Product } from './product.entity';

@Entity()
export class User extends BaseModel {
  // Basic Information
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 20, unique: true, nullable: true })
  phone_number: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  email: string;

  @Column({ type: 'text', nullable: true })
  about: string;

  // Role and Status
  @Column({ type: 'enum', enum: ['user', 'admin'], default: 'user' })
  role: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'boolean', default: false })
  is_verified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  last_active: Date;

  // Profile Images
  @Column({ type: 'varchar', length: 255, nullable: true })
  photo: string; // Profile photo

  @Column({ type: 'varchar', length: 255, nullable: true })
  banner_mobile: string; // Mobile banner image

  @Column({ type: 'varchar', length: 255, nullable: true })
  banner_desktop: string; // Desktop banner image

  @Column({ type: 'varchar', length: 255, nullable: true })
  logo: string; // Company logo

  // Business Information
  @Column({ type: 'boolean', default: false })
  is_professional_seller: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  business_name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  business_type: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  business_city: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  business_category: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  business_website: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  passport_file: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  business_certificate_file: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'approved', 'rejected'],
    nullable: true,
  })
  professional_application_status: string;

  @Column({ type: 'text', nullable: true })
  application_notes: string;

  // Statistics
  @Column({ type: 'int', default: 0 })
  total_ads: number;

  @Column({ type: 'int', default: 0 })
  subscribers_count: number;

  @Column({ type: 'int', default: 0 })
  ratings_count: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  average_rating: number;

  // Contact Preferences
  @Column({ type: 'boolean', default: true })
  chat_enabled: boolean;

  @Column({ type: 'boolean', default: true })
  call_enabled: boolean;

  @Column({ type: 'boolean', default: false })
  telegram_enabled: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  telegram_username: string;

  // Social and Business Settings
  @Column({ type: 'boolean', default: true })
  other_ads_enabled: boolean;

  @Column({ type: 'boolean', default: false })
  b2c_business_page: boolean;

  @Column({ type: 'boolean', default: false })
  is_online: boolean;

  @Column({ type: 'timestamp', nullable: true })
  last_seen: Date;

  @Column({ type: 'varchar', length: 50, nullable: true })
  seller_type: string;

  @Column({ type: 'varchar', length: 36, unique: true })
  telegram_id: string;

  @Column({
    type: 'enum',
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
  })
  status: string;

  // Social Network Integration
  @Column({ type: 'varchar', length: 50, nullable: true })
  social_network_account_type: string; // 'google', 'telegram', 'apple', 'facebook'

  @Column({ type: 'varchar', length: 255, nullable: true })
  social_network_id: string; // External social network user ID

  // Relationships
  @OneToMany(() => Product, (product) => product.created_by)
  products: Product[];
}
