import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { DocumentVersion } from './document-version.entity';

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'varchar', length: 100, default: 'General' })
  folder: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 255 })
  file_name: string;

  @Column({ type: 'bigint', default: 0 })
  file_size: number;

  @Column({ type: 'varchar', length: 100 })
  mime_type: string;

  @Column({ type: 'varchar', length: 500 })
  s3_key: string;

  @Column({ type: 'int', default: 1 })
  current_version: number;

  @Column({ type: 'varchar', length: 50, default: 'clean' })
  status: string; // 'clean' | 'quarantined' | 'scanning'

  @Column({ type: 'uuid', nullable: true })
  created_by_user_id: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @OneToMany(() => DocumentVersion, (v) => v.document, { cascade: true })
  versions: DocumentVersion[];
}
