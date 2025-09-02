import { DataSource } from 'typeorm';
import { Region } from '../core/entity/region.entity';
import * as fs from 'fs';
import * as path from 'path';
import { config } from '../config';

async function seedRegions() {
  console.log('Starting region seed...');

  const dataSource = new DataSource({
    type: 'postgres',
    host: config.DB_HOST,
    port: +config.DB_PORT,
    username: config.DB_USER,
    password: config.DB_PASS,
    database: config.DB_NAME,
    entities: ['src/core/entity/*.entity{.ts,.js}'],
    synchronize: true,
  });

  try {
    await dataSource.initialize();
    console.log('Database connection successful.');

    const regionRepository = dataSource.getRepository(Region);

    // Check if data already exists
    const count = await regionRepository.count();
    console.log(`Current region count: ${count}`);

    if (count > 0) {
      console.log('Region data already exists. Skipping seed.');
      return;
    }

    // Load region data from JSON file
    const regionDataPath = path.join(__dirname, 'regions.json');
    console.log(`Loading data from: ${regionDataPath}`);

    const regionData = JSON.parse(fs.readFileSync(regionDataPath, 'utf-8'));
    console.log(`Loaded ${regionData.length} regions`);

    // Process and save regions
    let inserted = 0;
    for (const region of regionData) {
      await processRegion(regionRepository, region);
      inserted++;
      if (inserted % 100 === 0) {
        console.log(`Inserted ${inserted} regions`);
      }
    }

    const finalCount = await regionRepository.count();
    console.log(`Region seeding completed. Total regions: ${finalCount}`);
  } catch (error) {
    console.error('Error during seeding:', error);
    console.error('Stack:', error.stack);
  } finally {
    await dataSource.destroy();
  }
}

async function processRegion(repository: any, region: any, parent: any = null) {
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
  const savedRegion = await repository.save(regionEntity);

  // Process children if they exist
  if (region.children && Array.isArray(region.children)) {
    for (const child of region.children) {
      await processRegion(repository, child, savedRegion);
    }
  }
}

// Run the seed if this file is executed directly
if (require.main === module) {
  seedRegions();
}
