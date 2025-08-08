import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-facebook';
import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { config } from 'src/config';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: config.FACEBOOK_CLIENT_ID,
      clientSecret: config.FACEBOOK_CLIENT_SECRET,
      callbackURL: config.FACEBOOK_CALLBACK_URL,
      profileFields: ['id', 'emails', 'name', 'picture.type(large)'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: Function,
  ) {
    try {
      const user = await this.authService.socialLogin({
        social_network_account_type: 'facebook',
        social_network_id: profile.id,
        name: `${profile.name.givenName} ${profile.name.familyName}`.trim(),
        email: profile.emails?.[0]?.value || null,
        photo: profile.photos?.[0]?.value || null,
      });
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }
}
