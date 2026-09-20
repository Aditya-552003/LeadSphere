import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('pipeline_stages')
export class PipelineStage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', default: '#1976d2' })
  color: string;

  @Column({ type: 'int', default: 0 })
  position: number;

  @Column({ type: 'smallint', default: 10 })
  probability: number;

  @Column({ type: 'boolean', default: false })
  is_won: boolean;

  @Column({ type: 'boolean', default: false })
  is_lost: boolean;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
