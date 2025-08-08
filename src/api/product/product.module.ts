import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { Product } from 'src/core/entity/product.entity';
import { ProductImage } from 'src/core/entity/product-image.entity';
import { FileUploadService } from 'src/common/service/file-upload.service';

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductImage])],
  controllers: [ProductController],
  providers: [ProductService, FileUploadService],
  exports: [ProductService],
})
export class ProductModule {}
 