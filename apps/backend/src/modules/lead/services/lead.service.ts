import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead, LeadScoreSource } from '../entities/lead.entity';
import { CustomField } from '../entities/custom-field.entity';
import { Tag } from '../entities/tag.entity';
import { LeadTag } from '../entities/lead-tag.entity';
import { LeadNote } from '../entities/lead-note.entity';
import { LeadActivity } from '../entities/lead-activity.entity';
import { CreateLeadDto } from '../dto/create-lead.dto';
import { UpdateLeadDto } from '../dto/update-lead.dto';
import { AuditService } from '../../audit/services/audit.service';

@Injectable()
export class LeadService {
  constructor(
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,
    @InjectRepository(CustomField)
    private readonly customFieldRepository: Repository<CustomField>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    @InjectRepository(LeadTag)
    private readonly leadTagRepository: Repository<LeadTag>,
    @InjectRepository(LeadNote)
    private readonly leadNoteRepository: Repository<LeadNote>,
    @InjectRepository(LeadActivity)
    private readonly leadActivityRepository: Repository<LeadActivity>,
    private readonly auditService: AuditService,
  ) {}

  async findAll(tenantId: string, q?: string, limit = 50, cursor?: string) {
    const queryBuilder = this.leadRepository
      .createQueryBuilder('lead')
      .where('lead.tenant_id = :tenantId', { tenantId })
      .andWhere('lead.deleted_at IS NULL')
      .orderBy('lead.created_at', 'DESC')
      .take(limit + 1);

    if (q && q.trim()) {
      queryBuilder.andWhere(
        '(lead.full_name ILIKE :q OR lead.company_name ILIKE :q OR lead.email ILIKE :q OR lead.phone ILIKE :q)',
        { q: `%${q.trim()}%` },
      );
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

    const nextCursor =
      hasMore && leads.length > 0
        ? Buffer.from(leads[leads.length - 1].created_at.toISOString()).toString('base64')
        : null;

    const totalEstimate = await this.leadRepository.count({
      where: { tenant_id: tenantId, deleted_at: null as any },
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

  async findOne(tenantId: string, id: string) {
    const lead = await this.leadRepository.findOne({
      where: { tenant_id: tenantId, id, deleted_at: null as any },
    });

    if (!lead) {
      throw new NotFoundException(`Lead with ID '${id}' not found`);
    }

    return lead;
  }

  async create(tenantId: string, actorId: string, dto: CreateLeadDto) {
    if (dto.custom) {
      await this.validateCustomFields(tenantId, dto.custom);
    }

    const emailNormalized = dto.email ? dto.email.toLowerCase().trim() : undefined;
    const phoneE164 = dto.phone ? dto.phone.replace(/[^\d+]/g, '') : undefined;
    const leadScore = this.calculateRuleBasedScore(dto);
    const designation = dto.designation || dto.title || undefined;
    const location = dto.location || dto.city || undefined;

    const lead = this.leadRepository.create({
      ...dto,
      designation,
      location,
      tenant_id: tenantId,
      email_normalized: emailNormalized,
      phone_e164: phoneE164,
      whatsapp_e164: phoneE164,
      lead_score: leadScore,
      score_source: LeadScoreSource.RULE,
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

  async update(tenantId: string, actorId: string, id: string, dto: UpdateLeadDto) {
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

  async remove(tenantId: string, actorId: string, id: string) {
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

  async getTimeline(tenantId: string, leadId: string) {
    await this.findOne(tenantId, leadId);
    const activities = await this.leadActivityRepository.find({
      where: { tenant_id: tenantId, lead_id: leadId },
      order: { occurred_at: 'DESC' },
    });
    return activities;
  }

  async addNote(tenantId: string, leadId: string, authorMembershipId: string, body: string) {
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

  private async logActivity(tenantId: string, leadId: string, type: string, actorId?: string, payload = {}) {
    const activity = this.leadActivityRepository.create({
      tenant_id: tenantId,
      lead_id: leadId,
      type,
      actor_membership_id: actorId,
      payload,
    });
    await this.leadActivityRepository.save(activity);
  }

  private calculateRuleBasedScore(lead: Partial<Lead> | CreateLeadDto): number {
    let score = 50; // base score
    if (lead.email) score += 15;
    if (lead.phone) score += 15;
    if (lead.company_name) score += 10;
    if (lead.designation && /vp|director|manager|cto|ceo|head/i.test(lead.designation)) score += 10;
    return Math.min(score, 100);
  }

  private async validateCustomFields(tenantId: string, custom: Record<string, any>) {
    const fieldDefs = await this.customFieldRepository.find({
      where: { tenant_id: tenantId, is_active: true },
    });

    for (const def of fieldDefs) {
      if (def.required && (custom[def.key] === undefined || custom[def.key] === null || custom[def.key] === '')) {
        throw new BadRequestException(`Custom field '${def.label}' is required`);
      }
    }
  }
}
