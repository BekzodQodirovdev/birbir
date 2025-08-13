import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { TelegramVerificationService } from '../service/telegram-verification.service';

@Injectable()
export class TelegramAuthGuard implements CanActivate {
  constructor(
    private readonly telegramVerificationService: TelegramVerificationService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const query = request.query;

    // Check if required data is present
    if (!query || !query.hash) {
      throw new UnauthorizedException('Missing Telegram login data');
    }

    // Verify the authentication data
    const isValid = this.telegramVerificationService.verifyTelegramAuthDataWithTimeCheck(
      query,
      86400, // 24 hours
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid Telegram authentication data');
    }

    // Add user data to request
    request.user = query;
    return true;
  }
}
