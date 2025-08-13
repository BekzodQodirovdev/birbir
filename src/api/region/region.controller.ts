import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { RegionService } from './region.service';
import { Region } from '../../core/entity/region.entity';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth.guard';
import { RolesGuard } from 'src/common/guard/roles.guard';
import { Roles } from 'src/common/decorator/roles.decorator';

@Controller('regions')
export class RegionController {
  constructor(private readonly regionService: RegionService) {}

  @Get()
  async findAll(): Promise<Region[]> {
    return await this.regionService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<Region | null> {
    return await this.regionService.findOne(id);
  }

  @Get('key/:key')
  async findByKey(@Param('key') key: string): Promise<Region | null> {
    return await this.regionService.findByKey(key);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async create(@Body() regionData: Partial<Region>): Promise<Region> {
    return await this.regionService.create(regionData);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async update(
    @Param('id') id: number,
    @Body() regionData: Partial<Region>,
  ): Promise<Region | null> {
    return await this.regionService.update(id, regionData);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async delete(@Param('id') id: number): Promise<void> {
    return await this.regionService.delete(id);
  }
}
