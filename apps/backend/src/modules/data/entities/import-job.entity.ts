import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ImportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('import_jobs')
@Index(['tenant_id', 'created_at'])
export class ImportJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  tenant_id: string;

  @Column({ type: 'uuid' })
  created_by: string;

  @Column({ type: 'varchar', length: 255 })
  filename: string;

  @Column({ type: 'int', default: 0 })
  total_rows: number;

  @Column({ type: 'int', default: 0 })
  processed_rows: number;

  @Column({ type: 'int', default: 0 })
  successful_rows: number;

  @Column({ type: 'int', default: 0 })
  failed_rows: number;

  @Column({ type: 'int', default: 0 })
  duplicate_rows: number;

  @Column({ type: 'enum', enum: ImportStatus, default: ImportStatus.PENDING })
  status: ImportStatus;

  @Column({ type: 'jsonb', nullable: true })
  column_mapping: Record<string, string>;

  @Column({ type: 'jsonb', nullable: true })
  error_log: Array<{ row: number; email?: string; reason: string }>;

  @Column({ type: 'varchar', length: 50, default: 'csv' })
  parsing_engine: string;

  @Column({ type: 'jsonb', nullable: true })
  extracted_tables_summary: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
