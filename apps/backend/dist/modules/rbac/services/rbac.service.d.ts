import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { RolePermission } from '../entities/role-permission.entity';
export declare class RbacService {
    private readonly roleRepository;
    private readonly permissionRepository;
    private readonly rolePermissionRepository;
    constructor(roleRepository: Repository<Role>, permissionRepository: Repository<Permission>, rolePermissionRepository: Repository<RolePermission>);
    findRoles(tenantId: string): Promise<Role[]>;
    findPermissions(): Promise<Permission[]>;
    createRole(tenantId: string, name: string, description?: string): Promise<Role>;
}
