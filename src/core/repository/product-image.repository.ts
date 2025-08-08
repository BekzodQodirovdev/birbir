import { Repository } from 'typeorm';
import { ProductImage } from 'src/core/entity/product-image.entity';

export type ProductImageRepository = Repository<ProductImage>;
