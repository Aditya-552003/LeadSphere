"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const tenant_entity_1 = require("../entities/tenant.entity");
const jwt = require("jsonwebtoken");
let TenantService = class TenantService {
    constructor(tenantRepository) {
        this.tenantRepository = tenantRepository;
    }
    async findAll() {
        return this.tenantRepository.find({ order: { created_at: 'DESC' } });
    }
    async findOne(id) {
        const tenant = await this.tenantRepository.findOne({ where: { id } });
        if (!tenant) {
            throw new common_1.NotFoundException(`Tenant with ID '${id}' not found`);
        }
        return tenant;
    }
    async create(name, slug) {
        const existing = await this.tenantRepository.findOne({ where: { slug } });
        if (existing) {
            throw new common_1.ConflictException(`Company workspace domain '${slug}' already exists.`);
        }
        const tenant = this.tenantRepository.create({ name, slug, status: tenant_entity_1.TenantStatus.ACTIVE });
        return this.tenantRepository.save(tenant);
    }
    async registerCompany(companyName, domain, adminName, adminEmail, password, plan = 'pro') {
        const slug = domain.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
        const existing = await this.tenantRepository.findOne({ where: { slug } });
        let tenant;
        if (existing) {
            tenant = existing;
        }
        else {
            tenant = this.tenantRepository.create({
                name: companyName,
                slug,
                status: tenant_entity_1.TenantStatus.ACTIVE,
            });
            tenant = await this.tenantRepository.save(tenant);
        }
        const userId = `usr_${Date.now()}`;
        const jwtSecret = process.env.JWT_SECRET || 'super_secret_jwt_key_leadsphere_dev';
        const accessToken = jwt.sign({
            sub: userId,
            email: adminEmail,
            name: adminName,
            tenant_id: tenant.id,
            tenant_name: tenant.name,
            tenant_slug: tenant.slug,
            role: 'COMPANY_ADMIN',
        }, jwtSecret, { expiresIn: '15m' });
        return {
            message: 'Company workspace provisioned successfully',
            tenant: {
                id: tenant.id,
                name: tenant.name,
                slug: tenant.slug,
                plan,
                status: tenant.status,
            },
            user: {
                id: userId,
                name: adminName,
                email: adminEmail,
                role: 'COMPANY_ADMIN',
            },
            access_token: accessToken,
            workspace_url: `/app/dashboard?tenant=${tenant.slug}`,
        };
    }
    async updateStatus(id, status) {
        const tenant = await this.findOne(id);
        tenant.status = status;
        return this.tenantRepository.save(tenant);
    }
};
exports.TenantService = TenantService;
exports.TenantService = TenantService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(tenant_entity_1.Tenant)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], TenantService);
//# sourceMappingURL=tenant.service.js.map