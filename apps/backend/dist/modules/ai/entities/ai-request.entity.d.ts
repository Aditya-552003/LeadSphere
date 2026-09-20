export declare enum AiActionType {
    SUMMARIZE_LEAD = "summarize_lead",
    DRAFT_EMAIL = "draft_email",
    CLASSIFY_SENTIMENT = "classify_sentiment",
    SUGGEST_NEXT_STEP = "suggest_next_step"
}
export declare class AiRequest {
    id: string;
    tenant_id: string;
    created_by: string;
    action_type: AiActionType;
    prompt_tokens: number;
    completion_tokens: number;
    model_name: string;
    disclaimer_label: string;
    created_at: Date;
}
