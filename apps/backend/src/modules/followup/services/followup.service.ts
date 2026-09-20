import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan, MoreThan } from 'typeorm';
import {
  Followup,
  FollowupPriority,
  FollowupStatus,
  FollowupRecurrence,
} from '../entities/followup.entity';
import { LeadActivity } from '../../lead/entities/lead-activity.entity';

@Injectable()
export class FollowupService {
  constructor(
    @InjectRepository(Followup)
    private readonly followupRepository: Repository<Followup>,
    @InjectRepository(LeadActivity)
    private readonly activityRepository: Repository<LeadActivity>,
  ) {}

  async create(
    tenantId: string,
    userId: string,
    dto: {
      title: string;
      notes?: string;
      lead_id?: string;
      due_at: string;
      timezone?: string;
      priority?: FollowupPriority;
      recurrence?: FollowupRecurrence;
    },
  ) {
    const followup = this.followupRepository.create({
      tenant_id: tenantId,
      created_by: userId,
      assigned_to: userId,
      lead_id: dto.lead_id || undefined,
      title: dto.title,
      notes: dto.notes,
      due_at: new Date(dto.due_at),
      timezone: dto.timezone || 'UTC',
      priority: dto.priority || FollowupPriority.MEDIUM,
      recurrence: dto.recurrence || FollowupRecurrence.NONE,
      status: FollowupStatus.PENDING,
    });

    const saved = await this.followupRepository.save(followup);

    if (dto.lead_id) {
      await this.activityRepository.save(
        this.activityRepository.create({
          tenant_id: tenantId,
          lead_id: dto.lead_id,
          actor_membership_id: userId,
          type: 'FOLLOWUP_SCHEDULED',
          payload: { description: `Scheduled follow-up: "${dto.title}" for ${new Date(dto.due_at).toLocaleString()}` },
        }),
      );
    }

    return saved;
  }

  async findAll(
    tenantId: string,
    filterType?: 'overdue' | 'today' | 'upcoming' | 'completed' | 'all',
  ) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const query = this.followupRepository
      .createQueryBuilder('f')
      .leftJoinAndSelect('f.lead', 'lead')
      .where('f.tenant_id = :tenantId', { tenantId });

    if (filterType === 'overdue') {
      query.andWhere('f.due_at < :startOfToday', { startOfToday })
           .andWhere('f.status = :pending', { pending: FollowupStatus.PENDING });
    } else if (filterType === 'today') {
      query.andWhere('f.due_at BETWEEN :startOfToday AND :endOfToday', { startOfToday, endOfToday })
           .andWhere('f.status != :completed', { completed: FollowupStatus.COMPLETED });
    } else if (filterType === 'upcoming') {
      query.andWhere('f.due_at > :endOfToday', { endOfToday })
           .andWhere('f.status = :pending', { pending: FollowupStatus.PENDING });
    } else if (filterType === 'completed') {
      query.andWhere('f.status = :completed', { completed: FollowupStatus.COMPLETED });
    }

    query.orderBy('f.due_at', filterType === 'completed' ? 'DESC' : 'ASC');
    return query.getMany();
  }

  async getCalendarEvents(tenantId: string, startStr?: string, endStr?: string) {
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

  async markCompleted(tenantId: string, userId: string, id: string) {
    const followup = await this.followupRepository.findOne({ where: { id, tenant_id: tenantId } });
    if (!followup) throw new NotFoundException('Followup not found');

    followup.status = FollowupStatus.COMPLETED;
    followup.completed_at = new Date();
    await this.followupRepository.save(followup);

    if (followup.lead_id) {
      await this.activityRepository.save(
        this.activityRepository.create({
          tenant_id: tenantId,
          lead_id: followup.lead_id,
          actor_membership_id: userId,
          type: 'FOLLOWUP_COMPLETED',
          payload: { description: `Completed follow-up: "${followup.title}"` },
        }),
      );
    }

    // Auto Recurrence Logic
    if (followup.recurrence && followup.recurrence !== FollowupRecurrence.NONE) {
      const nextDueDate = new Date(followup.due_at);
      if (followup.recurrence === FollowupRecurrence.DAILY) {
        nextDueDate.setDate(nextDueDate.getDate() + 1);
      } else if (followup.recurrence === FollowupRecurrence.WEEKLY) {
        nextDueDate.setDate(nextDueDate.getDate() + 7);
      } else if (followup.recurrence === FollowupRecurrence.MONTHLY) {
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

  async snooze(tenantId: string, id: string, snoozeHours = 24) {
    const followup = await this.followupRepository.findOne({ where: { id, tenant_id: tenantId } });
    if (!followup) throw new NotFoundException('Followup not found');

    const newDueDate = new Date();
    newDueDate.setHours(newDueDate.getHours() + snoozeHours);

    followup.status = FollowupStatus.SNOOZED;
    followup.snoozed_until = newDueDate;
    followup.due_at = newDueDate;

    return this.followupRepository.save(followup);
  }

  async remove(tenantId: string, id: string) {
    const followup = await this.followupRepository.findOne({ where: { id, tenant_id: tenantId } });
    if (!followup) throw new NotFoundException('Followup not found');
    return this.followupRepository.remove(followup);
  }
}
