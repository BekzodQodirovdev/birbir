import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, Min } from 'class-validator';

export class CreatePromotionDto {
  @ApiProperty({
    description: 'Promotion type',
    enum: ['maxi', 'premium', 'urgent'],
  })
  @IsEnum(['maxi', 'premium', 'urgent'])
  promotion_type: string;

  @ApiProperty({ description: 'Promotion duration in days' })
  @IsNumber()
  @Min(1)
  duration_days: number;
}

export class PromotionResponseDto {
  @ApiProperty({ description: 'Promotion type' })
  promotion_type: string;

  @ApiProperty({ description: 'Promotion price' })
  price: number;

  @ApiProperty({ description: 'Duration in days' })
  duration_days: number;

  @ApiProperty({ description: 'Features included' })
  features: {
    large_photo: boolean;
    premium_badge: boolean;
    photo_gallery: boolean;
    direct_contacts: boolean;
  };
}
