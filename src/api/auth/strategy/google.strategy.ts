import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { config } from 'src/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: config.GOOGLE_CLIENT_ID,
      clientSecret: config.GOOGLE_CLIENT_SECRET,
      callbackURL: config.GOOGLE_CALLBACK_URL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ) {
    try {
      const user = await this.authService.socialLogin({
        social_network_account_type: 'google',
        social_network_id: profile.id,
        name: profile.displayName,
        email: profile.emails?.[0]?.value || null,
        photo: profile.photos?.[0]?.value || null,
      });
      console.log(profile);
      done(null, user);
    } catch (error) {
      done(error, false); // Changed from null to false
    }
  }
}
