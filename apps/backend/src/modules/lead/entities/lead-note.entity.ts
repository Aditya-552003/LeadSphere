import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('lead_notes')
export class LeadNote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'uuid' })
  lead_id: string;

  @Column({ type: 'uuid' })
  author_membership_id: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'boolean', default: false })
  pinned: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
