import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  @Index({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  registerTime: Date;
}