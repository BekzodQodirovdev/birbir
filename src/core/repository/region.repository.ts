import { EntityRepository, Repository } from 'typeorm';
import { Region } from '../entity/region.entity';

@EntityRepository(Region)
export class RegionRepository extends Repository<Region> {
  // Custom repository methods can be added here
}