import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from 'src/core/entity/user.entity';
import { GoogleStrategy } from './strategy/google.strategy';
import { FacebookStrategy } from './strategy/facebook.strategy';
import { config } from 'src/config';
import { TelegramAuthGuard } from 'src/common/guard/telegram.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: config.ACCESS_TOKEN_KEY,
      signOptions: { expiresIn: config.ACCESS_TOKEN_TIME },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy, FacebookStrategy, TelegramAuthGuard],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
