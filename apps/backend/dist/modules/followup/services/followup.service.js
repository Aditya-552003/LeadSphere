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
exports.FollowupService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const followup_entity_1 = require("../entities/followup.entity");
const lead_activity_entity_1 = require("../../lead/entities/lead-activity.entity");
let FollowupService = class FollowupService {
    constructor(followupRepository, activityRepository) {
        this.followupRepository = followupRepository;
        this.activityRepository = activityRepository;
    }
    async create(tenantId, userId, dto) {
        const followup = this.followupRepository.create({
            tenant_id: tenantId,
            created_by: userId,
            assigned_to: userId,
            lead_id: dto.lead_id || undefined,
            title: dto.title,
            notes: dto.notes,
            due_at: new Date(dto.due_at),
            timezone: dto.timezone || 'UTC',
            priority: dto.priority || followup_entity_1.FollowupPriority.MEDIUM,
            recurrence: dto.recurrence || followup_entity_1.FollowupRecurrence.NONE,
            status: followup_entity_1.FollowupStatus.PENDING,
        });
        const saved = await this.followupRepository.save(followup);
        if (dto.lead_id) {
            await this.activityRepository.save(this.activityRepository.create({
                tenant_id: tenantId,
                lead_id: dto.lead_id,
                actor_membership_id: userId,
                type: 'FOLLOWUP_SCHEDULED',
                payload: { description: `Scheduled follow-up: "${dto.title}" for ${new Date(dto.due_at).toLocaleString()}` },
            }));
        }
        return saved;
    }
    async findAll(tenantId, filterType) {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        const query = this.followupRepository
            .createQueryBuilder('f')
            .leftJoinAndSelect('f.lead', 'lead')
            .where('f.tenant_id = :tenantId', { tenantId });
        if (filterType === 'overdue') {
            query.andWhere('f.due_at < :startOfToday', { startOfToday })
                .andWhere('f.status = :pending', { pending: followup_entity_1.FollowupStatus.PENDING });
        }
        else if (filterType === 'today') {
            query.andWhere('f.due_at BETWEEN :startOfToday AND :endOfToday', { startOfToday, endOfToday })
                .andWhere('f.status != :completed', { completed: followup_entity_1.FollowupStatus.COMPLETED });
        }
        else if (filterType === 'upcoming') {
            query.andWhere('f.due_at > :endOfToday', { endOfToday })
                .andWhere('f.status = :pending', { pending: followup_entity_1.FollowupStatus.PENDING });
        }
        else if (filterType === 'completed') {
            query.andWhere('f.status = :completed', { completed: followup_entity_1.FollowupStatus.COMPLETED });
        }
        query.orderBy('f.due_at', filterType === 'completed' ? 'DESC' : 'ASC');
        return query.getMany();
    }
    async getCalendarEvents(tenantId, startStr, endStr) {
        const now = new Date();
        const startDate = startStr ? new Date(startStr) : new Date(now.getFullYear(), now.getMonth(), 1);
        const endDate = endStr ? new Date(endStr) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        const followups = await this.followupRepository
            .createQueryBuilder('f')
            .leftJoinAndSelect('f.lead', 'lead')
            .where('f.tenant_id = :tenantId', { tenantId })
            .andWhere('f.due_at BETWEEN :startDate AND :endDate', { startDate, endDate })
            .orderBy('f.due_at', 'ASC')
            .getMany();
        return followups;
    }
    async markCompleted(tenantId, userId, id) {
        const followup = await this.followupRepository.findOne({ where: { id, tenant_id: tenantId } });
        if (!followup)
            throw new common_1.NotFoundException('Followup not found');
        followup.status = followup_entity_1.FollowupStatus.COMPLETED;
        followup.completed_at = new Date();
        await this.followupRepository.save(followup);
        if (followup.lead_id) {
            await this.activityRepository.save(this.activityRepository.create({
                tenant_id: tenantId,
                lead_id: followup.lead_id,
                actor_membership_id: userId,
                type: 'FOLLOWUP_COMPLETED',
                payload: { description: `Completed follow-up: "${followup.title}"` },
            }));
        }
        if (followup.recurrence && followup.recurrence !== followup_entity_1.FollowupRecurrence.NONE) {
            const nextDueDate = new Date(followup.due_at);
            if (followup.recurrence === followup_entity_1.FollowupRecurrence.DAILY) {
                nextDueDate.setDate(nextDueDate.getDate() + 1);
            }
            else if (followup.recurrence === followup_entity_1.FollowupRecurrence.WEEKLY) {
                nextDueDate.setDate(nextDueDate.getDate() + 7);
            }
            else if (followup.recurrence === followup_entity_1.FollowupRecurrence.MONTHLY) {
                nextDueDate.setMonth(nextDueDate.getMonth() + 1);
            }
            await this.create(tenantId, userId, {
                title: followup.title,
                notes: followup.notes,
                lead_id: followup.lead_id,
                due_at: nextDueDate.toISOString(),
                timezone: followup.timezone,
                priority: followup.priority,
                recurrence: followup.recurrence,
            });
        }
        return followup;
    }
    async snooze(tenantId, id, snoozeHours = 24) {
        const followup = await this.followupRepository.findOne({ where: { id, tenant_id: tenantId } });
        if (!followup)
            throw new common_1.NotFoundException('Followup not found');
        const newDueDate = new Date();
        newDueDate.setHours(newDueDate.getHours() + snoozeHours);
        followup.status = followup_entity_1.FollowupStatus.SNOOZED;
        followup.snoozed_until = newDueDate;
        followup.due_at = newDueDate;
        return this.followupRepository.save(followup);
    }
    async remove(tenantId, id) {
        const followup = await this.followupRepository.findOne({ where: { id, tenant_id: tenantId } });
        if (!followup)
            throw new common_1.NotFoundException('Followup not found');
        return this.followupRepository.remove(followup);
    }
};
exports.FollowupService = FollowupService;
exports.FollowupService = FollowupService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(followup_entity_1.Followup)),
    __param(1, (0, typeorm_1.InjectRepository)(lead_activity_entity_1.LeadActivity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], FollowupService);
//# sourceMappingURL=followup.service.js.map