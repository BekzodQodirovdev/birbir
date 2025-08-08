import { BaseModel } from 'src/common/database';
import { Column, Entity, ManyToOne } from 'typeorm';
import { Product } from './product.entity';

@Entity()
export class ProductImage extends BaseModel {
  @Column()
  filename: string;

  @Column()
  original_name: string;

  @Column()
  mime_type: string;

  @Column({ type: 'int' })
  size: number; // bytes

  @Column({ type: 'int', nullable: true })
  width: number;

  @Column({ type: 'int', nullable: true })
  height: number;

  @Column({ type: 'int', default: 0 })
  rotation: number;

  @Column({ type: 'int', default: 0 })
  order_index: number; // For sorting images

  @Column({ type: 'boolean', default: false })
  is_main: boolean; // Main image flag

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @ManyToOne(() => Product, (product) => product.images, {
    onDelete: 'CASCADE',
  })
  product: Product;

  @Column()
  product_id: string;
}
