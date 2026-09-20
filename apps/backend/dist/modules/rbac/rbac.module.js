"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RbacModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const role_entity_1 = require("./entities/role.entity");
const permission_entity_1 = require("./entities/permission.entity");
const role_permission_entity_1 = require("./entities/role-permission.entity");
const group_entity_1 = require("./entities/group.entity");
const group_member_entity_1 = require("./entities/group-member.entity");
const permission_override_entity_1 = require("./entities/permission-override.entity");
const rbac_service_1 = require("./services/rbac.service");
const rbac_controller_1 = require("./controllers/rbac.controller");
let RbacModule = class RbacModule {
};
exports.RbacModule = RbacModule;
exports.RbacModule = RbacModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                role_entity_1.Role,
                permission_entity_1.Permission,
                role_permission_entity_1.RolePermission,
                group_entity_1.Group,
                group_member_entity_1.GroupMember,
                permission_override_entity_1.PermissionOverride,
            ]),
        ],
        controllers: [rbac_controller_1.RbacController],
        providers: [rbac_service_1.RbacService],
        exports: [rbac_service_1.RbacService],
    })
], RbacModule);
//# sourceMappingURL=rbac.module.js.map