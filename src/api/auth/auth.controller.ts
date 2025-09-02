import {
  Controller,
  Body,
  Get,
  Post,
  Request,
  UseGuards,
  Res,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { Request as ERequest, Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth.guard';
import { config } from 'src/config';
import { Public } from 'src/common/decorator/public.decorator';
import { TelegramAuthGuard } from 'src/common/guard/telegram.guard';
import { JwtService } from '@nestjs/jwt';
import { TelegramAuthService } from './telegram-auth.service';

// Extend Express Request to include user property
declare module 'express' {
  interface Request {
    user?: {
      id: string;
      first_name: string;
      username: string;
      photo_url: string;
      phone_number?: string;
    };
  }
}

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly telegramAuthService: TelegramAuthService,
    private readonly jwtService: JwtService,
  ) {}

  @Public()
  @Post('telegram/complete')
  async completeTelegramAuth(
    @Body()
    body: {
      name: string;
      phone: string;
      photo: string;
      telegramId: string;
      username: string;
      sessionToken: string;
    },
  ) {
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

    return { success: true, jwt };
  }

  @Public()
  @Get('telegram')
  @UseGuards(TelegramAuthGuard)
  async telegramLogin(@Req() req: ERequest, @Res() res: Response) {
    const user = req.user;

    if (!user) {
      throw new UnauthorizedException('User not found in request');
    }

    // Generate JWT token for the user
    const token = await this.authService.generateJwtTelegram(user);

    // Redirect to frontend with token
    const redirectUrl = `${config.FRONTEND_SOCIAL_LOGIN_URL}?token=${token}`;
    return res.redirect(redirectUrl);
  }

  @Public()
  @Post('telegram')
  @UseGuards(TelegramAuthGuard)
  async telegramLoginPost(@Req() req: { user: any }, @Res() res: Response) {
    const user = req.user as {
      id: string;
      first_name: string;
      username: string;
      photo_url: string;
    };

    try {
      // Process Telegram login and generate JWT token
      const result = (await this.authService.socialLogin({
        social_network_account_type: 'telegram',
        social_network_id: user.id,
        name: user.first_name,
        telegram_username: user.username,
        photo: user.photo_url,
        telegram_id: user.id,
      })) as {
        access_token: string;
        id: string;
        name: string;
        telegram_username: string;
        photo: string;
      };

      return res.json({
        success: true,
        access_token: result.access_token,
        user: {
          id: result.id,
          name: result.name,
          telegram_username: result.telegram_username,
          photo: result.photo,
        },
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to process Telegram login',
      });
    }
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Retrieve the profile of the currently authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  async getProfile(@Request() req: { user: { sub: string } }) {
    return this.authService.findUserById(req.user.sub);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Tokens refreshed successfully',
  })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(@Body() body: { refresh_token: string }) {
    return this.authService.refreshToken(body.refresh_token);
  }
}
