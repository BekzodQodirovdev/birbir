import { Injectable, Logger } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { config } from 'src/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class TelegramBotService {
  private readonly logger = new Logger(Telegraf.name);
  private bot: Telegraf;
  private userSessions: Map<number, string> = new Map(); // userId -> sessionToken

  constructor(private readonly httpService: HttpService) {
    this.initializeBot();
  }

  private initializeBot(): void {
    try {
      this.bot = new Telegraf(config.TELEGRAM_BOT_TOKEN);
      this.setupBot();
      this.bot.launch();
      this.logger.log('Telegram bot started successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Telegram bot', error);
    }
  }

  private setupBot(): void {
    // Handle /start command with session token
    this.bot.start(async (ctx) => {
      // Extract session token from the start payload
      const messageText = ctx.message?.text || '';
      const sessionToken = messageText.split(' ')[1]; // /start <sessionToken>

      if (!sessionToken) {
        await ctx.reply(
          'Welcome! Please initiate login from the website to use this bot.',
        );
        return;
      }

      // Store session token for this user
      if (ctx.from?.id) {
        this.userSessions.set(ctx.from.id, sessionToken);
      }

      // Send contact request button
      await ctx.reply('Please share your contact information to continue:', {
        reply_markup: {
          keyboard: [[{ text: 'Share Contact', request_contact: true }]],
          one_time_keyboard: true,
          resize_keyboard: true,
        },
      });
    });

    // Handle contact information
    this.bot.on('contact', async (ctx) => {
      // Get session token for this user
      let sessionToken: string | undefined;
      if (ctx.from?.id) {
        sessionToken = this.userSessions.get(ctx.from.id);
      }

      if (!sessionToken) {
        await ctx.reply('Please initiate login from the website first.');
        return;
      }

      const contact = ctx.message?.contact;

      if (!contact) {
        await ctx.reply('Contact information not received. Please try again.');
        return;
      }

      try {
        // Get user profile photos
        let photoUrl = '';
        if (ctx.from) {
          try {
            const photos = await ctx.telegram.getUserProfilePhotos(
              ctx.from.id,
              0,
              1,
            );
            if (photos.photos.length > 0 && photos.photos[0].length > 0) {
              const fileId = photos.photos[0][0].file_id;
              const fileLink = await ctx.telegram.getFileLink(fileId);
              photoUrl = fileLink.toString();
            }
          } catch (photoError) {
            this.logger.warn('Could not fetch user profile photo', photoError);
          }
        }

        // Send data to backend
        const userData = {
          sessionToken,
          name:
            contact.first_name +
            (contact.last_name ? ` ${contact.last_name}` : ''),
          phone: contact.phone_number,
          telegramId: contact.user_id
            ? contact.user_id.toString()
            : ctx.from?.id
              ? ctx.from.id.toString()
              : '',
          username: ctx.from?.username || '',
          photo: photoUrl,
        };

        // Call backend API to complete authentication
        const response = await firstValueFrom(
          this.httpService.post(
            `${config.DOMAIN}/api/auth/telegram/complete`,
            userData,
          ),
        );

        // Remove session from memory after use
        if (ctx.from?.id) {
          this.userSessions.delete(ctx.from.id);
        }

        if (response.data && response.data.status === 'success') {
          await ctx.reply(
            'Authentication successful! You can now close this chat and return to the website.',
          );
        } else {
          await ctx.reply('Authentication failed. Please try again.');
        }
      } catch (error) {
        this.logger.error('Error processing contact information', error);
        await ctx.reply(
          'An error occurred during authentication. Please try again.',
        );
      }
    });

    // Handle other messages
    this.bot.on('message', async (ctx) => {
      // Get session token for this user
      let sessionToken: string | undefined;
      if (ctx.from?.id) {
        sessionToken = this.userSessions.get(ctx.from.id);
      }

      if (!sessionToken) {
        await ctx.reply('Please initiate login from the website first.');
        return;
      }

      await ctx.reply(
        'Please share your contact information using the button below.',
      );
    });
  }

  public getBot(): Telegraf {
    return this.bot;
  }
}