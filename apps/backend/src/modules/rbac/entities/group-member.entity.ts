import { Entity, PrimaryColumn } from 'typeorm';

@Entity('group_members')
export class GroupMember {
  @PrimaryColumn({ type: 'uuid' })
  tenant_id: string;

  @PrimaryColumn({ type: 'uuid' })
  group_id: string;

  @PrimaryColumn({ type: 'uuid' })
  membership_id: string;
}
