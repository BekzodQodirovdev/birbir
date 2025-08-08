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

  @ManyToOne(() => User, (user) => user.products)
  created_by: User;

  @Column()
  created_by_id: string;

  @OneToMany(() => ProductImage, (image) => image.product, { cascade: true })
  images: ProductImage[];
}
 