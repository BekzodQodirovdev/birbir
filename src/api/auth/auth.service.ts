import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { DeepPartial, Repository } from 'typeorm';
import { User } from 'src/core/entity/user.entity';
import { CreateAuthDto } from './dto/create-auth.dto';
import { v4 as uuidv4 } from 'uuid';
import { config } from 'src/config';
import { BcryptManage } from 'src/infrastructure/lib/bcrypt';
import { TelegramSession } from './telegram-session.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(TelegramSession)
    private readonly sessionRepository: Repository<TelegramSession>,
    private readonly jwtService: JwtService,
    private readonly bcryptManage: BcryptManage,
  ) {}

  private sessionStore = new Map<string, any>(); // sessionToken -> JWT yoki user data

  saveUserSession(sessionToken: string, jwt: string) {
    if (this.sessionStore.has(sessionToken)) {
      this.sessionStore.set(sessionToken, { jwt });
    }
  }

  getJWTBySession(sessionToken: string) {
    const data = this.sessionStore.get(sessionToken);
    return data?.jwt;
  }

  async socialLogin(data: CreateAuthDto): Promise<any> {
    try {
      let user = await this.userRepository.findOne({
        where: {
          social_network_account_type: data.social_network_account_type,
          social_network_id: data.social_network_id,
        },
      });

      if (!user) {
        if (data.email) {
          const existingUser = await this.userRepository.findOne({
            where: { email: data.email },
          });
          if (existingUser) {
            throw new BadRequestException(
              'User with this email already exists',
            );
          }
        }

        user = this.userRepository.create({
          name: data?.name,
          email: data?.email || null,
          telegram_username: data?.telegram_username || null,
          photo: data?.photo || null,
          social_network_id: data?.social_network_id,
          social_network_account_type: data?.social_network_account_type,
          telegram_id: data?.telegram_id || null,
          is_active: true,
          phone_number: data?.phone_number || null,
        } as DeepPartial<User>);

        await this.userRepository.save(user);
      }

      // Generate refresh token
      const refreshToken = this.generateRefreshToken();
      const refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Update user with refresh token
      user.refresh_token = refreshToken;
      user.refresh_token_expires = refreshTokenExpires;
      await this.userRepository.save(user);

      return {
        ...user,
        access_token: this.generateJwt(user),
        refresh_token: refreshToken,
        expires_in: config.ACCESS_TOKEN_TIME,
      };
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Failed to process social login',
      );
    }
  }

  generateJwt(user: User) {
    return this.jwtService.sign(
      { sub: user.id, role: user.role },
      {
        secret: config.ACCESS_TOKEN_KEY,
        expiresIn: config.ACCESS_TOKEN_TIME,
      },
    );
  }

  async findUserById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return user;
  }

  async findUserByPhone(phone_number: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { phone_number } });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return user;
  }

  async updateUser(id: string, updateData: Partial<User>): Promise<User> {
    const user = await this.findUserById(id);
    Object.assign(user, updateData);
    return await this.userRepository.save(user);
  }

  async generateJwtTelegram(user: {
    id: string;
    first_name: string;
    username: string;
    photo_url: string;
    phone_number?: string;
  }) {
    // Check if user already exists
    let currentUser = await this.userRepository.findOne({
      where: { telegram_id: user.id },
    });

    // If user doesn't exist, create a new one
    if (!currentUser) {
      currentUser = this.userRepository.create({
        name: user.first_name,
        telegram_id: user.id,
        telegram_username: user.username,
        photo: user.photo_url,
        social_network_account_type: 'telegram',
        social_network_id: user.id,
        is_active: true,
        phone_number: user.phone_number || null,
      } as DeepPartial<User>);
      await this.userRepository.save(currentUser);
    }

    // Generate JWT token
    return this.jwtService.sign(
      { sub: currentUser.id, role: currentUser.role },
      {
        secret: config.ACCESS_TOKEN_KEY,
        expiresIn: config.ACCESS_TOKEN_TIME,
      },
    );
  }

  async registerUser(data: {
    name: string;
    email: string;
    password: string;
    phone_number?: string;
  }): Promise<any> {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await this.bcryptManage.createBcryptPassword(
      data.password,
    );

    // Create new user
    const user = this.userRepository.create({
      name: data.name,
      email: data.email,
      phone_number: data.phone_number || null,
      password: hashedPassword,
      is_active: true,
      email_verified: false, // Email verification will be required
    } as DeepPartial<User>);

    await this.userRepository.save(user);

    // Generate email verification token
    // const verificationToken = uuidv4();
    // In a real implementation, you would save this token and send an email

    // Generate JWT token
    const access_token = this.generateJwt(user);

    return {
      ...user,
      access_token,
    };
  }

  async loginUser(email: string, password: string): Promise<any> {
    // Find user by email
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is locked
    if (user.locked_until && user.locked_until > new Date()) {
      throw new UnauthorizedException('Account is locked');
    }

    // Verify password
    const isPasswordValid = await this.bcryptManage.comparePassword(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      // Increment login attempts
      user.login_attempts = (user.login_attempts || 0) + 1;

      // Lock account after 5 failed attempts
      if (user.login_attempts >= 5) {
        user.locked_until = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
      }

      await this.userRepository.save(user);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset login attempts on successful login
    if (user.login_attempts > 0) {
      user.login_attempts = 0;
      user.locked_until = new Date(0); // Set to epoch time to indicate no lock
      await this.userRepository.save(user);
    }

    // Update last login time
    user.last_login_at = new Date();
    await this.userRepository.save(user);

    // Generate JWT token
    const access_token = this.generateJwt(user);

    return {
      ...user,
      access_token,
    };
  }

  async logoutUser(userId: string): Promise<void> {
    // Clear refresh token
    const user = await this.findUserById(userId);
    user.refresh_token = '';
    await this.userRepository.save(user);
  }

  async refreshToken(refreshToken: string): Promise<any> {
    try {
      // Find user by refresh token
      const user = await this.userRepository.findOne({
        where: { refresh_token: refreshToken },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Check if refresh token is expired
      if (
        user.refresh_token_expires &&
        user.refresh_token_expires < new Date()
      ) {
        // Clear expired refresh token
        user.refresh_token = null as any;
        user.refresh_token_expires = null as any;
        await this.userRepository.save(user);
        throw new UnauthorizedException('Refresh token expired');
      }

      // Generate new access token
      const access_token = this.generateJwt(user);

      // Generate new refresh token for security (token rotation)
      const newRefreshToken = this.generateRefreshToken();
      const refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Update user with new refresh token
      user.refresh_token = newRefreshToken;
      user.refresh_token_expires = refreshTokenExpires;
      await this.userRepository.save(user);

      return {
        access_token,
        refresh_token: newRefreshToken,
        expires_in: config.ACCESS_TOKEN_TIME,
      };
    } catch (error) {
      throw new UnauthorizedException('Token refresh failed');
    }
  }

  private generateRefreshToken(): string {
    return this.jwtService.sign(
      { type: 'refresh' },
      {
        secret: config.REFRESH_TOKEN_KEY,
        expiresIn: config.REFRESH_TOKEN_TIME,
      },
    );
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      // We don't reveal if the email exists for security reasons
      return;
    }

    // Generate password reset token
    const resetToken = uuidv4();
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    // Save token and expiration
    user.password_reset_token = resetToken;
    user.password_reset_expires = resetExpires;
    await this.userRepository.save(user);

    // In a real implementation, you would send an email with the reset link
    // sendPasswordResetEmail(user.email, resetToken);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: {
        password_reset_token: token,
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired token');
    }

    // Check if token is expired
    if (user.password_reset_expires < new Date()) {
      throw new BadRequestException('Token has expired');
    }

    // Hash new password
    const hashedPassword =
      await this.bcryptManage.createBcryptPassword(newPassword);

    // Update password and clear reset token
    user.password = hashedPassword;
    user.password_reset_token = '';
    user.password_reset_expires = new Date(0);
    await this.userRepository.save(user);
  }


  // async verifyTwoFactor(userId: string, token: string): Promise<boolean> {
  //   const user = await this.findUserById(userId);

  //   if (!user.two_factor_enabled || !user.two_factor_secret) {
  //     return false;
  //   }

  //   // In a real implementation, you would verify the token using the secret
  //   // For now, we'll just return true
  //   // return verifyToken(user.two_factor_secret, token);
  //   return true;
  // }

  // async getActiveSessions(userId: string): Promise<any[]> {
  //   // In a real implementation, you would retrieve active sessions from a session store
  //   // For now, we'll return a placeholder
  //   return [];
  // }

  // async logoutFromSession(userId: string, sessionId: string): Promise<void> {
  //   // In a real implementation, you would invalidate the specific session
  //   // For now, this is a placeholder
  // }
//   async logoutFromAllSessions(userId: string): Promise<void> {
//     // In a real implementation, you would invalidate all sessions for the user
//     // For now, this is a placeholder
//   }
}
