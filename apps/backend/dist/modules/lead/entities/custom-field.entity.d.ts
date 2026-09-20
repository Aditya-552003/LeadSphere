export declare enum CustomFieldType {
    TEXT = "text",
    LONGTEXT = "longtext",
    NUMBER = "number",
    DECIMAL = "decimal",
    CURRENCY = "currency",
    DATE = "date",
    DATETIME = "datetime",
    BOOLEAN = "boolean",
    SELECT = "select",
    MULTISELECT = "multiselect",
    URL = "url",
    EMAIL = "email",
    PHONE = "phone"
}
export declare class CustomField {
    id: string;
    tenant_id: string;
    entity: string;
    key: string;
    label: string;
    type: CustomFieldType;
    options: string[];
    required: boolean;
    position: number;
    is_active: boolean;
    created_at: Date;
}
