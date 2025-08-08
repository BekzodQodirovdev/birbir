import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class UpdatePasswordDto {
  @ApiProperty({
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Invalid email address' })
  email: string;

  @ApiProperty({
    example: 'NewPassword123!',
  })
  @IsString({ message: 'New password must be a string' })
  password: string;
}
