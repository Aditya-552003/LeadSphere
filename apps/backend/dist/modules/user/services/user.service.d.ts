import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Membership } from '../entities/membership.entity';
import { Invitation } from '../entities/invitation.entity';
import { InviteUserDto } from '../dto/invite-user.dto';
import { AuditService } from '../../audit/services/audit.service';
export declare class UserService {
    private readonly userRepository;
    private readonly membershipRepository;
    private readonly invitationRepository;
    private readonly auditService;
    constructor(userRepository: Repository<User>, membershipRepository: Repository<Membership>, invitationRepository: Repository<Invitation>, auditService: AuditService);
    findTeamMembers(tenantId: string): Promise<{
        membership_id: string;
        user_id: string;
        email: string;
        full_name: string;
        role_id: string;
        status: string;
        last_active_at: Date;
        created_at: Date;
    }[]>;
    inviteUser(tenantId: string, actorId: string, dto: InviteUserDto): Promise<{
        message: string;
        membership_id: string;
        email: string;
    }>;
    updateUserRole(tenantId: string, actorId: string, membershipId: string, roleId: string): Promise<Membership>;
    deactivateMember(tenantId: string, actorId: string, membershipId: string): Promise<{
        message: string;
    }>;
}
