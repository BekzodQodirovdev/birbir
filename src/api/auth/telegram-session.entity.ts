import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class TelegramSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  sessionToken: string;

  @Column({ default: false })
  isUsed: boolean;

  @Column({ default: false })
  isExpired: boolean;

  @Column()
  expiresAt: Date;

  @Column({ nullable: true })
  telegramId: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  username: string;

  @Column({ nullable: true })
  photo: string;
}
