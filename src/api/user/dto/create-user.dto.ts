import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ description: 'User name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'User phone number' })
  @IsString()
  phone_number: string;

  @ApiProperty({ description: 'User profile picture', required: false })
  @IsOptional()
  @IsString()
  picture?: string;

  @ApiProperty({ description: 'User active status', required: false })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiProperty({
    description: 'User role',
    enum: ['user', 'admin'],
    default: 'user',
    required: false,
  })
  @IsOptional()
  @IsEnum(['user', 'admin'])
  role?: string;
}
