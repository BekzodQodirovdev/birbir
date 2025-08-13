import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Region } from '../../core/entity/region.entity';
import { RegionService } from './region.service';
import { RegionController } from './region.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Region]), AuthModule],
  providers: [RegionService],
  controllers: [RegionController],
  exports: [RegionService],
})
export class RegionModule {}
