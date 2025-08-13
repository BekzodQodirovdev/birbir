import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { HttpModule } from '@nestjs/axios';
import { TelegramAuthController } from './telegram-auth.controller';
import { TelegramAuthService } from './telegram-auth.service';
import { AuthModule } from '../auth/auth.module';
import { User } from 'src/core/entity/user.entity';
import { config } from 'src/config';
import { TelegramSession } from './telegram-session.entity';
import { TelegramWebsocketGateway } from './telegram-websocket.gateway';
import { TelegramBotService } from './telegram-bot.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, TelegramSession]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: config.ACCESS_TOKEN_KEY,
      signOptions: { expiresIn: config.ACCESS_TOKEN_TIME },
    }),
    HttpModule,
    AuthModule,
  ],
  controllers: [TelegramAuthController],
  providers: [
    TelegramAuthService,
    TelegramWebsocketGateway,
    TelegramBotService
  ],
  exports: [TelegramAuthService, TelegramWebsocketGateway, TelegramBotService],
})
export class TelegramAuthModule {}