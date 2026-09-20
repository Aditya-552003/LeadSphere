import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'uuid', nullable: true })
  tenant_id: string;

  @Column({ type: 'text' })
  refresh_hash: string;

  @Column({ type: 'text', nullable: true })
  device: string;

  @Column({ type: 'text', nullable: true })
  ip: string;

  @Column({ type: 'text', nullable: true })
  user_agent: string;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  last_seen_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  revoked_at: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
