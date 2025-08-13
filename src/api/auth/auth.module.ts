import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from 'src/core/entity/user.entity';
import { config } from 'src/config';
import { TelegramAuthGuard } from 'src/common/guard/telegram.guard';
import { TelegramVerificationService } from 'src/common/service/telegram-verification.service';
import { BcryptManage } from 'src/infrastructure/lib/bcrypt';
import { TelegramSession } from './telegram-session.entity';
import { TelegramAuthModule } from './telegram-auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, TelegramSession]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: config.ACCESS_TOKEN_KEY,
      signOptions: { expiresIn: config.ACCESS_TOKEN_TIME },
    }),
    forwardRef(() => TelegramAuthModule),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TelegramAuthGuard,
    TelegramVerificationService,
    BcryptManage,
    JwtService,
  ],
  exports: [AuthService, JwtModule, JwtService, TelegramVerificationService],
})
export class AuthModule {}
