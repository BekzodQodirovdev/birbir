import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Region } from '../core/entity/region.entity';
// @ts-ignore
import regionData from './regions.json';

@Injectable()
export class RegionSeedService {
  constructor(
    @InjectRepository(Region)
    private readonly regionRepository: Repository<Region>,
  ) {}

  async seed() {
    // Check if data already exists
    const count = await this.regionRepository.count();
    if (count > 0) {
      console.log('Region data already exists. Skipping seed.');
      return;
    }

    // Process and save regions
    for (const region of regionData) {
      await this.processRegion(region);
    }

    console.log('Region seeding completed.');
  }

  private async processRegion(region: any, parent: Region | null = null) {
    // Create region entity
    const regionEntity = new Region();
    regionEntity.regionId = region.id;
    regionEntity.key = region.key;
    regionEntity.title = region.title;
    regionEntity.whereTitle = region.whereTitle;
    regionEntity.location = {
      type: region.location.type,
      coordinates: region.location.coordinates,
    };
    regionEntity.webUri = region.webUri;
    regionEntity.webUriInfo = {
      uz: region.webUriInfo.uz,
      ru: region.webUriInfo.ru,
    };
    regionEntity.isWholeCountry = region.isWholeCountry;
    regionEntity.titlePath = region.titlePath;
    if (parent) {
      regionEntity.parent = parent;
    }

    // Save region
    const savedRegion = await this.regionRepository.save(regionEntity);

    // Process children if they exist
    if (region.children && Array.isArray(region.children)) {
      for (const child of region.children) {
        await this.processRegion(child, savedRegion);
      }
    }
  }
}