import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { RolePermission } from '../entities/role-permission.entity';

@Injectable()
export class RbacService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
  ) {}

  async findRoles(tenantId: string) {
    const roles = await this.roleRepository.find({
      where: [{ tenant_id: tenantId }, { is_system: true }],
    });
    return roles;
  }

  async findPermissions() {
    return this.permissionRepository.find();
  }

  async createRole(tenantId: string, name: string, description?: string) {
    const role = this.roleRepository.create({
      tenant_id: tenantId,
      name,
      description,
      is_system: false,
    });
    return this.roleRepository.save(role);
  }
}
