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
exports.LeadService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const lead_entity_1 = require("../entities/lead.entity");
const custom_field_entity_1 = require("../entities/custom-field.entity");
const tag_entity_1 = require("../entities/tag.entity");
const lead_tag_entity_1 = require("../entities/lead-tag.entity");
const lead_note_entity_1 = require("../entities/lead-note.entity");
const lead_activity_entity_1 = require("../entities/lead-activity.entity");
const audit_service_1 = require("../../audit/services/audit.service");
let LeadService = class LeadService {
    constructor(leadRepository, customFieldRepository, tagRepository, leadTagRepository, leadNoteRepository, leadActivityRepository, auditService) {
        this.leadRepository = leadRepository;
        this.customFieldRepository = customFieldRepository;
        this.tagRepository = tagRepository;
        this.leadTagRepository = leadTagRepository;
        this.leadNoteRepository = leadNoteRepository;
        this.leadActivityRepository = leadActivityRepository;
        this.auditService = auditService;
    }
    async findAll(tenantId, q, limit = 50, cursor) {
        const queryBuilder = this.leadRepository
            .createQueryBuilder('lead')
            .where('lead.tenant_id = :tenantId', { tenantId })
            .andWhere('lead.deleted_at IS NULL')
            .orderBy('lead.created_at', 'DESC')
            .take(limit + 1);
        if (q && q.trim()) {
            queryBuilder.andWhere('(lead.full_name ILIKE :q OR lead.company_name ILIKE :q OR lead.email ILIKE :q OR lead.phone ILIKE :q)', { q: `%${q.trim()}%` });
        }
        if (cursor) {
            const decodedDate = new Date(Buffer.from(cursor, 'base64').toString('ascii'));
            queryBuilder.andWhere('lead.created_at < :cursorDate', { cursorDate: decodedDate });
        }
        const leads = await queryBuilder.getMany();
        const hasMore = leads.length > limit;
        if (hasMore) {
            leads.pop();
        }
        const nextCursor = hasMore && leads.length > 0
            ? Buffer.from(leads[leads.length - 1].created_at.toISOString()).toString('base64')
            : null;
        const totalEstimate = await this.leadRepository.count({
            where: { tenant_id: tenantId, deleted_at: null },
        });
        return {
            data: leads,
            page: {
                next_cursor: nextCursor,
                has_more: hasMore,
                total_estimate: totalEstimate,
            },
        };
    }
    async findOne(tenantId, id) {
        const lead = await this.leadRepository.findOne({
            where: { tenant_id: tenantId, id, deleted_at: null },
        });
        if (!lead) {
            throw new common_1.NotFoundException(`Lead with ID '${id}' not found`);
        }
        return lead;
    }
    async create(tenantId, actorId, dto) {
        if (dto.custom) {
            await this.validateCustomFields(tenantId, dto.custom);
        }
        const emailNormalized = dto.email ? dto.email.toLowerCase().trim() : undefined;
        const phoneE164 = dto.phone ? dto.phone.replace(/[^\d+]/g, '') : undefined;
        const leadScore = this.calculateRuleBasedScore(dto);
        const lead = this.leadRepository.create({
            ...dto,
            tenant_id: tenantId,
            email_normalized: emailNormalized,
            phone_e164: phoneE164,
            whatsapp_e164: phoneE164,
            lead_score: leadScore,
            score_source: lead_entity_1.LeadScoreSource.RULE,
        });
        const savedLead = await this.leadRepository.save(lead);
        await this.logActivity(tenantId, savedLead.id, 'LEAD_CREATED', actorId, {
            full_name: savedLead.full_name,
        });
        await this.auditService.log({
            tenantId,
            actorId,
            action: 'LEAD_CREATED',
            entityType: 'lead',
            entityId: savedLead.id,
            metadata: { full_name: savedLead.full_name, email: savedLead.email },
        });
        return savedLead;
    }
    async update(tenantId, actorId, id, dto) {
        const lead = await this.findOne(tenantId, id);
        if (dto.custom) {
            await this.validateCustomFields(tenantId, dto.custom);
        }
        if (dto.email) {
            lead.email_normalized = dto.email.toLowerCase().trim();
        }
        if (dto.phone) {
            lead.phone_e164 = dto.phone.replace(/[^\d+]/g, '');
        }
        Object.assign(lead, dto);
        lead.lead_score = this.calculateRuleBasedScore(lead);
        const updatedLead = await this.leadRepository.save(lead);
        await this.logActivity(tenantId, updatedLead.id, 'LEAD_UPDATED', actorId, {
            updated_fields: Object.keys(dto),
        });
        await this.auditService.log({
            tenantId,
            actorId,
            action: 'LEAD_UPDATED',
            entityType: 'lead',
            entityId: updatedLead.id,
        });
        return updatedLead;
    }
    async remove(tenantId, actorId, id) {
        const lead = await this.findOne(tenantId, id);
        lead.deleted_at = new Date();
        await this.leadRepository.save(lead);
        await this.auditService.log({
            tenantId,
            actorId,
            action: 'LEAD_DELETED',
            entityType: 'lead',
            entityId: lead.id,
        });
        return { message: 'Lead soft-deleted successfully' };
    }
    async getTimeline(tenantId, leadId) {
        await this.findOne(tenantId, leadId);
        const activities = await this.leadActivityRepository.find({
            where: { tenant_id: tenantId, lead_id: leadId },
            order: { occurred_at: 'DESC' },
        });
        return activities;
    }
    async addNote(tenantId, leadId, authorMembershipId, body) {
        await this.findOne(tenantId, leadId);
        const note = this.leadNoteRepository.create({
            tenant_id: tenantId,
            lead_id: leadId,
            author_membership_id: authorMembershipId,
            body,
        });
        const savedNote = await this.leadNoteRepository.save(note);
        await this.logActivity(tenantId, leadId, 'NOTE_ADDED', authorMembershipId, {
            note_id: savedNote.id,
        });
        return savedNote;
    }
    async logActivity(tenantId, leadId, type, actorId, payload = {}) {
        const activity = this.leadActivityRepository.create({
            tenant_id: tenantId,
            lead_id: leadId,
            type,
            actor_membership_id: actorId,
            payload,
        });
        await this.leadActivityRepository.save(activity);
    }
    calculateRuleBasedScore(lead) {
        let score = 50;
        if (lead.email)
            score += 15;
        if (lead.phone)
            score += 15;
        if (lead.company_name)
            score += 10;
        if (lead.designation && /vp|director|manager|cto|ceo|head/i.test(lead.designation))
            score += 10;
        return Math.min(score, 100);
    }
    async validateCustomFields(tenantId, custom) {
        const fieldDefs = await this.customFieldRepository.find({
            where: { tenant_id: tenantId, is_active: true },
        });
        for (const def of fieldDefs) {
            if (def.required && (custom[def.key] === undefined || custom[def.key] === null || custom[def.key] === '')) {
                throw new common_1.BadRequestException(`Custom field '${def.label}' is required`);
            }
        }
    }
};
exports.LeadService = LeadService;
exports.LeadService = LeadService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(lead_entity_1.Lead)),
    __param(1, (0, typeorm_1.InjectRepository)(custom_field_entity_1.CustomField)),
    __param(2, (0, typeorm_1.InjectRepository)(tag_entity_1.Tag)),
    __param(3, (0, typeorm_1.InjectRepository)(lead_tag_entity_1.LeadTag)),
    __param(4, (0, typeorm_1.InjectRepository)(lead_note_entity_1.LeadNote)),
    __param(5, (0, typeorm_1.InjectRepository)(lead_activity_entity_1.LeadActivity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        audit_service_1.AuditService])
], LeadService);
//# sourceMappingURL=lead.service.js.map