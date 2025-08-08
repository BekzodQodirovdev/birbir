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
}
