import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRepository } from 'src/core/repository/user.repository';
import { User } from 'src/core/entity/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ProfessionalApplicationDto } from './dto/professional-application.dto';
import { ContactPreferencesDto } from './dto/contact-preferences.dto';
import { BcryptManage } from 'src/infrastructure/lib/bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly repository: UserRepository,
    private readonly bcryptManage: BcryptManage,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.repository.findOne({
      where: { phone_number: createUserDto.phone_number },
    });

    if (existingUser) {
      throw new ConflictException('User with this phone number already exists');
    }

    const user = this.repository.create({
      ...createUserDto,
      role: createUserDto.role || 'user',
      is_active: createUserDto.is_active ?? true,
    });

    return await this.repository.save(user);
  }

  async findAll(): Promise<User[]> {
    return await this.repository.find({
      where: { is_active: true },
      relations: ['products'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.repository.findOne({
      where: { id, is_active: true },
      relations: ['products'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByPhone(phoneNumber: string): Promise<User> {
    const user = await this.repository.findOne({
      where: { phone_number: phoneNumber, is_active: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByRole(role: string): Promise<User[]> {
    return await this.repository.find({
      where: { role, is_active: true },
      relations: ['products'],
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // Role o'zgartirish faqat admin uchun
    if (updateUserDto.role && user.role !== 'admin') {
      throw new BadRequestException('Only admins can change roles');
    }

    Object.assign(user, updateUserDto);
    return await this.repository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    user.is_active = false;
    await this.repository.save(user);
  }

  async activate(id: string): Promise<User> {
    const user = await this.repository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.is_active = true;
    return await this.repository.save(user);
  }

  async deactivate(id: string): Promise<User> {
    const user = await this.findOne(id);
    user.is_active = false;
    return await this.repository.save(user);
  }

  async changeRole(id: string, newRole: string): Promise<User> {
    if (!['user', 'admin'].includes(newRole)) {
      throw new BadRequestException('Invalid role');
    }

    const user = await this.findOne(id);
    user.role = newRole;
    return await this.repository.save(user);
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await this.repository.find({
      where: { role, is_active: true },
      relations: ['products'],
    });
  }

  // Profile statistikalarini hisoblash
  async updateUserStats(userId: string): Promise<User> {
    const user = await this.findOne(userId);

    // Productlar sonini hisoblash
    const productsCount = await this.repository
      .createQueryBuilder('user')
      .leftJoin('user.products', 'product')
      .where('user.id = :userId', { userId })
      .andWhere('product.is_active = :isActive', { isActive: true })
      .getCount();

    user.total_ads = productsCount;
    user.last_active = new Date();

    return await this.repository.save(user);
  }

  // User ni verify qilish
  async verifyUser(id: string): Promise<User> {
    const user = await this.findOne(id);
    user.is_verified = true;
    return await this.repository.save(user);
  }

  // User rating qo'shish
  async addRating(userId: string, rating: number): Promise<User> {
    if (rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    const user = await this.findOne(userId);

    const totalRating = user.average_rating * user.ratings_count + rating;
    user.ratings_count += 1;
    user.average_rating = totalRating / user.ratings_count;

    return await this.repository.save(user);
  }

  // Subscriber qo'shish
  async addSubscriber(userId: string): Promise<User> {
    const user = await this.findOne(userId);
    user.subscribers_count += 1;
    return await this.repository.save(user);
  }

  // Subscriber olib tashlash
  async removeSubscriber(userId: string): Promise<User> {
    const user = await this.findOne(userId);
    if (user.subscribers_count > 0) {
      user.subscribers_count -= 1;
    }
    return await this.repository.save(user);
  }

  // User profile ma'lumotlarini olish
  async getProfileStats(userId: string): Promise<{
    total_ads: number;
    subscribers_count: number;
    ratings_count: number;
    average_rating: number;
    is_verified: boolean;
  }> {
    const user = await this.findOne(userId);

    return {
      total_ads: user.total_ads,
      subscribers_count: user.subscribers_count,
      ratings_count: user.ratings_count,
      average_rating: user.average_rating,
      is_verified: user.is_verified,
    };
  }

  // Professional seller arizasi yuborish
  async submitProfessionalApplication(
    userId: string,
    applicationDto: ProfessionalApplicationDto,
  ): Promise<User> {
    const user = await this.findOne(userId);

    // Ariza allaqachon yuborilgan bo'lsa
    if (user.professional_application_status) {
      throw new BadRequestException('Application already submitted');
    }

    // Professional seller bo'lsa
    if (user.is_professional_seller) {
      throw new BadRequestException('User is already a professional seller');
    }

    Object.assign(user, {
      ...applicationDto,
      professional_application_status: 'pending',
    });

    return await this.repository.save(user);
  }

  // Professional seller arizasini ko'rish
  async getProfessionalApplication(userId: string): Promise<{
    business_name: string;
    business_type: string;
    business_city: string;
    business_category: string;
    business_website: string;
    professional_application_status: string;
    application_notes: string;
  }> {
    const user = await this.findOne(userId);

    return {
      business_name: user.business_name,
      business_type: user.business_type,
      business_city: user.business_city,
      business_category: user.business_category,
      business_website: user.business_website,
      professional_application_status: user.professional_application_status,
      application_notes: user.application_notes,
    };
  }

  // Contact preferences ni yangilash
  async updateContactPreferences(
    userId: string,
    preferencesDto: ContactPreferencesDto,
  ): Promise<User> {
    const user = await this.findOne(userId);

    Object.assign(user, preferencesDto);
    return await this.repository.save(user);
  }

  // Contact preferences ni olish
  async getContactPreferences(userId: string): Promise<{
    chat_enabled: boolean;
    call_enabled: boolean;
    telegram_enabled: boolean;
    telegram_username: string;
  }> {
    const user = await this.findOne(userId);

    return {
      chat_enabled: user.chat_enabled,
      call_enabled: user.call_enabled,
      telegram_enabled: user.telegram_enabled,
      telegram_username: user.telegram_username,
    };
  }

  // Professional sellerlar ro'yxatini olish (admin uchun)
  async getProfessionalSellers(): Promise<User[]> {
    return await this.repository.find({
      where: { is_professional_seller: true, is_active: true },
      relations: ['products'],
    });
  }

  // Ariza kutayotgan userlar ro'yxatini olish (admin uchun)
  async getPendingApplications(): Promise<User[]> {
    return await this.repository.find({
      where: { professional_application_status: 'pending' },
      relations: ['products'],
    });
  }
}
