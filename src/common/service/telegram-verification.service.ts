import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { config } from 'src/config';

@Injectable()
export class TelegramVerificationService {
  /**
   * Verify Telegram authentication data
   * @param data Telegram authentication data
   * @returns boolean indicating if the data is valid
   */
  verifyTelegramAuthData(data: any): boolean {
    const { hash, ...rest } = data;

    // Create the data check string
    const dataCheckString = Object.keys(rest)
      .sort()
      .map((key) => `${key}=${rest[key]}`)
      .join('\n');

    // Create the secret key
    const secretKey = crypto
      .createHash('sha256')
      .update(config.TELEGRAM_BOT_TOKEN)
      .digest();

    // Create the HMAC
    const hmac = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    // Compare the hashes
    return hmac === hash;
  }

  /**
   * Verify Telegram authentication data with time check
   * @param data Telegram authentication data
   * @param maxAge Maximum age of the authentication data in seconds (default: 86400 = 24 hours)
   * @returns boolean indicating if the data is valid and not expired
   */
  verifyTelegramAuthDataWithTimeCheck(data: any, maxAge: number = 86400): boolean {
    // Check if auth_date exists
    if (!data.auth_date) {
      return false;
    }

    // Check if the authentication data is not too old
    const authDate = parseInt(data.auth_date, 10);
    const currentDate = Math.floor(Date.now() / 1000);
    
    if (currentDate - authDate > maxAge) {
      return false;
    }

    // Verify the hash
    return this.verifyTelegramAuthData(data);
  }
}