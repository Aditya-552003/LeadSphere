import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { Group } from './entities/group.entity';
import { GroupMember } from './entities/group-member.entity';
import { PermissionOverride } from './entities/permission-override.entity';
import { RbacService } from './services/rbac.service';
import { RbacController } from './controllers/rbac.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Role,
      Permission,
      RolePermission,
      Group,
      GroupMember,
      PermissionOverride,
    ]),
  ],
  controllers: [RbacController],
  providers: [RbacService],
  exports: [RbacService],
})
export class RbacModule {}
