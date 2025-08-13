import {
  Controller,
  Get,
  Post,
  Body,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { TelegramAuthService } from './telegram-auth.service';
import { Public } from 'src/common/decorator/public.decorator';

@ApiTags('Telegram Authentication')
@Controller('auth/telegram')
export class TelegramAuthController {
  private readonly logger = new Logger(TelegramAuthController.name);

  constructor(private readonly telegramAuthService: TelegramAuthService) {}

  @Public()
  @Get('session')
  @ApiOperation({
    summary: 'Create a new Telegram authentication session',
    description: 'Generates a session token for Telegram authentication flow',
  })
  @ApiResponse({
    status: 200,
    description: 'Session token generated successfully',
    schema: {
      type: 'object',
      properties: {
        sessionToken: {
          type: 'string',
          example: '550e8400-e29b-41d4-a716-446655440000',
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async createSession(): Promise<{ sessionToken: string }> {
    try {
      const sessionToken = await this.telegramAuthService.createSession();
      return { sessionToken };
    } catch (error) {
      this.logger.error('Error creating Telegram session', error);
      throw new HttpException(
        'Failed to create session',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('complete')
  @ApiOperation({
    summary: 'Complete Telegram authentication',
    description:
      'Finishes the Telegram authentication process and returns a JWT token',
  })
  @ApiResponse({
    status: 200,
    description: 'Authentication completed successfully',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          example: 'success',
        },
        jwt: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or expired session token',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async completeAuthentication(
    @Body()
    body: {
      sessionToken: string;
      name: string;
      phone: string;
      telegramId: string;
      username: string;
      photo: string;
    },
  ): Promise<{ status: string; jwt: string }> {
    try {
      const jwt = await this.telegramAuthService.completeAuthentication(
        body.sessionToken,
        {
          name: body.name,
          phone: body.phone,
          telegramId: body.telegramId,
          username: body.username,
          photo: body.photo,
        },
      );
      return { status: 'success', jwt };
    } catch (error) {
      this.logger.error('Error completing Telegram authentication', error);
      throw error;
    }
  }
}
