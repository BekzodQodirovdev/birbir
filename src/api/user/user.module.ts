import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from 'src/core/entity/user.entity';
import { RolesGuard } from 'src/common/guard/roles.guard';
import { BcryptManage } from 'src/infrastructure/lib/bcrypt';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserController],
  providers: [UserService, RolesGuard, BcryptManage],
  exports: [UserService],
})
export class UserModule {}
