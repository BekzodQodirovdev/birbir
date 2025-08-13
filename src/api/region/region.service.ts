import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Region } from '../../core/entity/region.entity';

@Injectable()
export class RegionService {
  constructor(
    @InjectRepository(Region)
    private readonly regionRepository: Repository<Region>,
  ) {}

  async findAll(): Promise<Region[]> {
    return await this.regionRepository.find();
  }

  async findOne(id: number): Promise<Region | null> {
    return await this.regionRepository.findOne({ where: { regionId: id } });
  }

  async findByKey(key: string): Promise<Region | null> {
    return await this.regionRepository.findOne({ where: { key } });
  }

  async create(regionData: Partial<Region>): Promise<Region> {
    const region = this.regionRepository.create(regionData);
    return await this.regionRepository.save(region);
  }

  async update(id: number, regionData: Partial<Region>): Promise<Region | null> {
    await this.regionRepository.update({ regionId: id }, regionData);
    return await this.regionRepository.findOne({ where: { regionId: id } });
  }

  async delete(id: number): Promise<void> {
    await this.regionRepository.delete({ regionId: id });
  }
}