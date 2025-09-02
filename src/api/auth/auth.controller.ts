import {
  Controller,
  Body,
  Get,
  Post,
  Request,
  UseGuards,
  Res,
  Req,
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

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly telegramAuthService: TelegramAuthService,
    private readonly jwtService: JwtService,
  ) {}

  @Public()

  // auth.controller.ts
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
  async telegramLogin(@Req() req: { user: any }, @Res() res: Response) {
    const user = req.user as any;

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

  // @Public()
  // @Post('register')
  // @ApiOperation({
  //   summary: 'Register a new user',
  //   description: 'Create a new user account with email and password',
  // })
  // @ApiResponse({
  //   status: 201,
  //   description: 'User registered successfully',
  // })
  // @ApiResponse({
  //   status: 400,
  //   description: 'Bad request - Invalid input or user already exists',
  // })
  // async register(@Body() registerDto: RegisterUserDto) {
  //   return await this.authService.registerUser(registerDto);
  // }

  // @Public()
  // @Post('login')
  // @ApiOperation({
  //   summary: 'Login user',
  //   description: 'Authenticate user with email and password',
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'User logged in successfully',
  // })
  // @ApiResponse({
  //   status: 401,
  //   description: 'Unauthorized - Invalid credentials',
  // })
  // async login(@Body() loginDto: LoginUserDto) {
  //   return await this.authService.loginUser(loginDto.email, loginDto.password);
  // }

  // @Post('logout')
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  // @ApiOperation({
  //   summary: 'Logout user',
  //   description: 'Logout the currently authenticated user',
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'User logged out successfully',
  // })
  // @ApiResponse({
  //   status: 401,
  //   description: 'Unauthorized - Invalid or missing token',
  // })
  // async logout(@Request() req: any) {
  //   return await this.authService.logoutUser(req.user.sub);
  // }

  // @Public()
  // @Post('forgot-password')
  // @ApiOperation({
  //   summary: 'Forgot password',
  //   description: 'Send password reset email to user',
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Password reset email sent successfully',
  // })
  // async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
  //   await this.authService.forgotPassword(forgotPasswordDto.email);
  //   return { message: 'Password reset email sent successfully' };
  // }

  // @Public()
  // @Post('reset-password')
  // @ApiOperation({
  //   summary: 'Reset password',
  //   description: 'Reset user password with token',
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Password reset successfully',
  // })
  // @ApiResponse({
  //   status: 400,
  //   description: 'Bad request - Invalid or expired token',
  // })
  // async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
  //   await this.authService.resetPassword(
  //     resetPasswordDto.token,
  //     resetPasswordDto.newPassword,
  //   );
  //   return { message: 'Password reset successfully' };
  // }

  // @Post('enable-2fa')
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  // @ApiOperation({
  //   summary: 'Enable two-factor authentication',
  //   description: 'Enable 2FA for the currently authenticated user',
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Two-factor authentication enabled successfully',
  // })
  // @ApiResponse({
  //   status: 401,
  //   description: 'Unauthorized - Invalid or missing token',
  // })
  // async enable2fa(@Request() req: any) {
  //   return await this.authService.enableTwoFactor(req.user.sub);
  // }

  // @Post('disable-2fa')
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  // @ApiOperation({
  //   summary: 'Disable two-factor authentication',
  //   description: 'Disable 2FA for the currently authenticated user',
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Two-factor authentication disabled successfully',
  // })
  // @ApiResponse({
  //   status: 401,
  //   description: 'Unauthorized - Invalid or missing token',
  // })
  // async disable2fa(@Request() req: any) {
  //   await this.authService.disableTwoFactor(req.user.sub);
  //   return { message: 'Two-factor authentication disabled successfully' };
  // }

  // @Post('verify-2fa')
  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth()
  // @ApiOperation({
  //   summary: 'Verify two-factor authentication',
  //   description: 'Verify 2FA token for the currently authenticated user',
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Two-factor authentication verified successfully',
  // })
  // @ApiResponse({
  //   status: 401,
  //   description: 'Unauthorized - Invalid or missing token',
  // })
  // @ApiResponse({
  //   status: 400,
  //   description: 'Bad request - Invalid 2FA token',
  // })
  // async verify2fa(@Request() req: any, @Body() twoFactorDto: TwoFactorDto) {
  //   const isValid = await this.authService.verifyTwoFactor(
  //     req.user.sub,
  //     twoFactorDto.token,
  //   );
  //   if (!isValid) {
  //     throw new BadRequestException('Invalid 2FA token');
  //   }
  //   return { message: 'Two-factor authentication verified successfully' };
  // }
}
