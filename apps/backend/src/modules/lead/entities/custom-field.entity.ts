import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Unique } from 'typeorm';

export enum CustomFieldType {
  TEXT = 'text',
  LONGTEXT = 'longtext',
  NUMBER = 'number',
  DECIMAL = 'decimal',
  CURRENCY = 'currency',
  DATE = 'date',
  DATETIME = 'datetime',
  BOOLEAN = 'boolean',
  SELECT = 'select',
  MULTISELECT = 'multiselect',
  URL = 'url',
  EMAIL = 'email',
  PHONE = 'phone',
}

@Entity('custom_fields')
@Unique(['tenant_id', 'entity', 'key'])
export class CustomField {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @Column({ type: 'text', default: 'lead' })
  entity: string;

  @Column({ type: 'text' })
  key: string;

  @Column({ type: 'text' })
  label: string;

  @Column({ type: 'text', default: CustomFieldType.TEXT })
  type: CustomFieldType;

  @Column({ type: 'jsonb', default: [] })
  options: string[];

  @Column({ type: 'boolean', default: false })
  required: boolean;

  @Column({ type: 'int', default: 0 })
  position: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
