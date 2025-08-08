import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { config } from 'src/config';

@Injectable()
export class TelegramAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const query = request.query;

    if (!query || !query.hash) {
      throw new UnauthorizedException('Missing Telegram login data');
    }

    const secret = crypto
      .createHash('sha256')
      .update(config.TELEGRAM_BOT_TOKEN)
      .digest();

    const checkString = Object.keys(query)
      .filter((key) => key !== 'hash')
      .sort()
      .map((key) => `${key}=${query[key]}`)
      .join('\n');

    const hmac = crypto
      .createHmac('sha256', secret)
      .update(checkString)
      .digest('hex');

    if (hmac !== query.hash) {
      throw new UnauthorizedException('Invalid Telegram hash');
    }

    request.user = query;
    return true;
  }
}
