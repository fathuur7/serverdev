export type TicketCategory = 'NO_INTERNET' | 'SLOW_CONNECTION' | 'BILLING_ISSUE' | 'REQUEST_MOVE';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_CUSTOMER' | 'RESOLVED' | 'CLOSED';

export interface CreateTicketInput {
    subscriptionId: string;
    category: TicketCategory;
    priority: TicketPriority;
    subject: string;
    description: string;
}

export interface UpdateTicketInput {
    category?: TicketCategory;
    priority?: TicketPriority;
    subject?: string;
    description?: string;
    status?: TicketStatus;
}
