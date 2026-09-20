import { UserService } from '../services/user.service';
import { InviteUserDto } from '../dto/invite-user.dto';
import { ITenantContext } from '../../../common/interfaces/tenant-context.interface';
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
    findTeamMembers(ctx: ITenantContext): Promise<{
        data: {
            membership_id: string;
            user_id: string;
            email: string;
            full_name: string;
            role_id: string;
            status: string;
            last_active_at: Date;
            created_at: Date;
        }[];
    }>;
    inviteUser(ctx: ITenantContext, dto: InviteUserDto): Promise<{
        data: {
            message: string;
            membership_id: string;
            email: string;
        };
    }>;
    updateUserRole(ctx: ITenantContext, membershipId: string, roleId: string): Promise<{
        data: import("../entities/membership.entity").Membership;
    }>;
    deactivateMember(ctx: ITenantContext, membershipId: string): Promise<{
        data: {
            message: string;
        };
    }>;
}
