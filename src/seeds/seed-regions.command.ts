import { Command } from 'nestjs-command';
import { Injectable } from '@nestjs/common';
import { RegionSeedService } from './region.seed';

@Injectable()
export class SeedRegionsCommand {
  constructor(private readonly regionSeedService: RegionSeedService) {}

  @Command({
    command: 'seed:regions',
    describe: 'Seed regions data',
  })
  async run(): Promise<void> {
    await this.regionSeedService.seed();
  }
}
