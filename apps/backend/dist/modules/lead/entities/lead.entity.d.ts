export declare enum LeadScoreSource {
    MANUAL = "manual",
    RULE = "rule",
    AI = "ai"
}
export declare class Lead {
    id: string;
    tenant_id: string;
    first_name: string;
    last_name: string;
    full_name: string;
    company_name: string;
    designation: string;
    industry: string;
    email: string;
    email_normalized: string;
    phone: string;
    phone_e164: string;
    whatsapp_e164: string;
    website: string;
    linkedin: string;
    country: string;
    state: string;
    city: string;
    source: string;
    status_stage_id: string;
    lead_score: number;
    score_source: LeadScoreSource;
    owner_membership_id: string;
    last_contacted_at: Date;
    next_followup_at: Date;
    do_not_contact: boolean;
    email_opt_out: boolean;
    whatsapp_opt_out: boolean;
    custom: Record<string, any>;
    archived_at: Date;
    deleted_at: Date;
    import_id: string;
    created_at: Date;
    updated_at: Date;
}
