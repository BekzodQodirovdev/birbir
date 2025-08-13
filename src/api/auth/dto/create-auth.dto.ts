import { IsString, IsOptional, IsEnum, Length } from 'class-validator';

export class CreateAuthDto {
  @IsString()
  @Length(3, 100)
  name: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone_number?: string;

  @IsString()
  @IsOptional()
  telegram_username?: string;

  @IsString()
  @IsOptional()
  photo?: string;

  @IsEnum(['telegram'])
  social_network_account_type: string;

  @IsString()
  @Length(1, 255)
  social_network_id: string;

  // Telegram-specific fields
  @IsString()
  @Length(1, 255)
  @IsOptional()
  telegram_id?: string; // Make id required for Telegram

  @IsString()
  @IsOptional()
  first_name?: string;

  @IsString()
  @IsOptional()
  last_name?: string;

  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsOptional()
  photo_url?: string;

  @IsString()
  @IsOptional()
  hash?: string;
}
