import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsInt,
  IsUUID,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ description: 'Product name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Product description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Product price' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ description: 'Product stock quantity' })
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiProperty({ description: 'Product image URL', required: false })
  @IsOptional()
  @IsString()
  image_url?: string;

  @ApiProperty({
    description: 'Product condition',
    enum: ['new', 'used'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['new', 'used'])
  condition?: string;

  @ApiProperty({ description: 'Is price negotiable', required: false }) // narx kelishiladimi
  @IsOptional()
  @IsBoolean()
  is_negotiable?: boolean;

  @ApiProperty({ description: 'Is urgent sale', required: false }) // tez sotiladimi
  @IsOptional()
  @IsBoolean()
  is_urgent?: boolean;

  @ApiProperty({ description: 'Is free item', required: false })
  @IsOptional()
  @IsBoolean()
  is_free?: boolean;

  @ApiProperty({ description: 'Has delivery option', required: false }) // yetkazib berish mavjudmi
  @IsOptional()
  @IsBoolean()
  has_delivery?: boolean;

  @ApiProperty({ description: 'Product category', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ description: 'Product subcategory', required: false })
  @IsOptional()
  @IsString()
  subcategory?: string;

  @ApiProperty({ description: 'Product location', required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ description: 'Latitude coordinate', required: false })
  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @ApiProperty({ description: 'Longitude coordinate', required: false })
  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @ApiProperty({ description: 'Product active status', required: false })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiProperty({ description: 'Product slug for URL', required: false })
  @IsOptional()
  @IsString()
  slug?: string;

  // Draft/Published status tracking
  @ApiProperty({ description: 'Product status code', required: false })
  @IsOptional()
  @IsInt()
  status?: number;

  @ApiProperty({ description: 'Product tab/status', required: false })
  @IsOptional()
  @IsString()
  tab?: string;

  @ApiProperty({ description: 'Product expiration date', required: false })
  @IsOptional()
  @IsString()
  should_expired_at?: string;

  @ApiProperty({ description: 'Product first published date', required: false })
  @IsOptional()
  @IsString()
  first_published_at?: string;

  @ApiProperty({ description: 'Is product publishable', required: false })
  @IsOptional()
  @IsBoolean()
  publishable?: boolean;

  // Validation issues tracking
  @ApiProperty({ description: 'Product validation issues', required: false })
  @IsOptional()
  @IsString()
  issues?: string;

  // Additional metadata
  @ApiProperty({ description: 'Product UUID', required: false })
  @IsOptional()
  @IsUUID()
  uuid?: string;

  @ApiProperty({ description: 'Product web URI', required: false })
  @IsOptional()
  @IsString()
  web_uri?: string;

  @ApiProperty({ description: 'Product payload', required: false })
  @IsOptional()
  @IsString()
  payload?: string;

  @ApiProperty({ description: 'Product promotion data', required: false })
  @IsOptional()
  @IsString()
  promotion_data?: string;

  @ApiProperty({ description: 'Product statistics', required: false })
  @IsOptional()
  @IsString()
  statistics?: string;

  @ApiProperty({ description: 'Product top notice', required: false })
  @IsOptional()
  @IsString()
  notice_top?: string;

  @ApiProperty({ description: 'Product bottom notice', required: false })
  @IsOptional()
  @IsString()
  notice_bottom?: string;

  @ApiProperty({ description: 'Is delivery enabled', required: false })
  @IsOptional()
  @IsBoolean()
  delivery_enabled?: boolean;

  @ApiProperty({ description: 'Product gross price', required: false })
  @IsOptional()
  @IsNumber()
  gross_price?: number;

  @ApiProperty({ description: 'Product gross price discount', required: false })
  @IsOptional()
  @IsNumber()
  gross_price_discount?: number;

  @ApiProperty({ description: 'Product badges', required: false })
  @IsOptional()
  @IsString()
  badges?: string;
}
