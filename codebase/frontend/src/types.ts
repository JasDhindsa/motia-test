export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type Status = 'open' | 'triaged' | 'escalated' | 'closed';

export interface Ticket {
    id: string;
    title: string;
    description: string;
    priority: Priority;
    customerEmail: string;
    status: Status;
    createdAt: string;
    assignee?: string;
    triagedAt?: string;
    escalatedTo?: string;
    escalatedAt?: string;
    escalationReason?: string;
}
