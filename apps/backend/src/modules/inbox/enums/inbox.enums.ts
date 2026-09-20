export enum ConversationChannel {
  EMAIL = 'email',
  WHATSAPP = 'whatsapp',
}

export enum ConversationStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  ARCHIVED = 'archived',
}

export enum SenderType {
  USER = 'user',
  LEAD = 'lead',
  SYSTEM = 'system',
}

export enum MessageDirection {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
}

export enum DeliveryStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}
