import { Entity, PrimaryColumn } from 'typeorm';

@Entity('lead_tags')
export class LeadTag {
  @PrimaryColumn({ type: 'uuid' })
  tenant_id: string;

  @PrimaryColumn({ type: 'uuid' })
  lead_id: string;

  @PrimaryColumn({ type: 'uuid' })
  tag_id: string;
}
