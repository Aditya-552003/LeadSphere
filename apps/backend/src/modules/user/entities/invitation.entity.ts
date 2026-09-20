import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('invitations')
export class Invitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'text' })
  email: string;

  @Column({ type: 'uuid' })
  role_id: string;

  @Column({ type: 'text' })
  token_hash: string;

  @Column({ type: 'timestamptz' })
  expires_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  accepted_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  revoked_at: Date;

  @Column({ type: 'uuid' })
  invited_by: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
