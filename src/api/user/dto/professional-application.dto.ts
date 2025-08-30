import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export class ProfessionalApplicationDto {
  @ApiProperty({ description: 'Business name' })
  @IsString()
  business_name: string;

  @ApiProperty({
    description: 'Business type',
    enum: ['self_employed', 'ie', 'llc'],
  })
  @IsEnum(['self_employed', 'ie', 'llc'])
  business_type: string;

  @ApiProperty({ description: 'Business city' })
  @IsString()
  business_city: string;

  @ApiProperty({
    description: 'Business category',
    enum: [
      'clothing_footwear',
      'electronics',
      'beauty_health',
      'jewelry_accessories',
      'hobby_sport',
    ],
  })
  @IsEnum([
    'clothing_footwear',
    'electronics',
    'beauty_health',
    'jewelry_accessories',
    'hobby_sport',
  ])
  business_category: string;

  @ApiProperty({
    description: 'Business website or social media link',
    required: false,
  })
  @IsOptional()
  @IsString()
  business_website?: string;

  @ApiProperty({ description: 'Passport file path' })
  @IsString()
  passport_file: string;

  @ApiProperty({ description: 'Business certificate file path' })
  @IsString()
  business_certificate_file: string;
}
