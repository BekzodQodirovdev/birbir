import { BaseModel } from 'src/common/database';
import { Column, Entity, Index, OneToMany, ManyToOne } from 'typeorm';
import { User } from './user.entity';

export class Location {
  @Column({ type: 'varchar', length: 20 })
  type: string;

  @Column({ type: 'simple-array' })
  coordinates: number[];
}

export class WebUriInfo {
  @Column({ type: 'varchar', length: 100 })
  uz: string;

  @Column({ type: 'varchar', length: 100 })
  ru: string;
}

@Entity()
@Index(['key'], { unique: true })
export class Region extends BaseModel {
  @Column({ type: 'int' })
  regionId: number;

  @Column({ type: 'varchar', length: 100 })
  key: string;

  @Column({ type: 'varchar', length: 100 })
  title: string;

  @Column({ type: 'varchar', length: 100 })
  whereTitle: string;

  @Column(() => Location)
  location: Location;

  @Column({ type: 'varchar', length: 100 })
  webUri: string;

  @Column(() => WebUriInfo)
  webUriInfo: WebUriInfo;

  @Column({ type: 'boolean' })
  isWholeCountry: boolean;

  @Column({ type: 'simple-array' })
  titlePath: string[];

  // Relationships
  @OneToMany(() => User, (user) => user.region)
  users: User[];

  // For tree structure
  @OneToMany(() => Region, (region) => region.parent)
  children: Region[];

  @ManyToOne(() => Region, (region) => region.children, { nullable: true })
  parent: Region;
}
