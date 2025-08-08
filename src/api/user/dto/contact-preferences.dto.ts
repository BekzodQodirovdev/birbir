import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ContactPreferencesDto {
  @ApiProperty({ description: 'Enable chat contact', default: true })
  @IsBoolean()
  chat_enabled: boolean;

  @ApiProperty({ description: 'Enable call contact', default: false })
  @IsBoolean()
  call_enabled: boolean;

  @ApiProperty({ description: 'Enable Telegram contact', default: false })
  @IsBoolean()
  telegram_enabled: boolean;

  @ApiProperty({ description: 'Telegram username', required: false })
  @IsOptional()
  @IsString()
  telegram_username?: string;
}
