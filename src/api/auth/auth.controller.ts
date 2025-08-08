import {
  Controller,
  Body,
  Get,
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
import { AuthGuard } from '@nestjs/passport';
import { config } from 'src/config';
import { Public } from 'src/common/decorator/public.decorator';
import { TelegramAuthGuard } from 'src/common/guard/telegram.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleCallback(@Request() req: any, @Res() res: Response) {
    console.log('Google callback hit:', { user: req.user, query: req.query });
    return this.handleSocialRedirect(req, res);
  }

  @Public()
  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  async facebookLogin() {}

  @Public()
  @Get('facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  facebookCallback(@Request() req: any, @Res() res: Response) {
    return this.handleSocialRedirect(req, res);
  }

  @Public()
  @Get('telegram')
  @UseGuards(TelegramAuthGuard)
  telegramLogin(@Req() req: ERequest, @Res() res: Response) {
    const user = req.user as any;

    const payload = {
      id: user.id,
      first_name: user.first_name,
      username: user.username,
      photo_url: user.photo_url,
    };
    const token = this.authService.generateJwtTelegram(payload);

    const redirectUrl = `http://localhost:3001/login-success?token=${token}`;
    return res.redirect(redirectUrl);
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
  async getProfile(@Request() req: any) {
    return this.authService.findUserById(req.user.sub);
  }

  private handleSocialRedirect(req: any, res: Response) {
    const token = req.user?.access_token;
    const frontendUrl = config.FRONTEND_SOCIAL_LOGIN_URL;
    if (!token) {
      return res.redirect(`${frontendUrl}?error=NoToken`);
    }
    return res.redirect(`${frontendUrl}?token=${token}`);
  }
}
