import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Unique } from 'typeorm';

@Entity('tags')
@Unique(['tenant_id', 'name'])
export class Tag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', default: '#1976d2' })
  color: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
