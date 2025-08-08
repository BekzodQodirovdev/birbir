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

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

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
        } as DeepPartial<User>);

        await this.userRepository.save(user);
      }

      return {
        ...user,
        access_token: this.generateJwt(user),
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
  async generateJwtTelegram(user: any) {
    const currentUser = await this.userRepository.findOne({
      where: { telegram_id: user.id },
    });
    let newUser: User;
    if (!currentUser) {
      newUser = this.userRepository.create({
        id: uuidv4(),
        name: user.first_name,
        telegram_id: user.id,
        telegram_username: user.username,
        photo: user.photo_url,
        social_network_account_type: 'telegram',
        is_active: true,
      } as DeepPartial<User>);
      await this.userRepository.save(newUser);
    }
    return this.jwtService.sign(
      { sub: user.id, role: user.role },
      {
        secret: config.ACCESS_TOKEN_KEY,
        expiresIn: config.ACCESS_TOKEN_TIME,
      },
    );
  }
}
