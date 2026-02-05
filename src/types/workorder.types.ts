export type WorkOrderType = 'NEW_INSTALLATION' | 'REPAIR' | 'DISMANTLE';
export type WorkOrderStatus = 'DRAFT' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export interface CreateWorkOrderInput {
    subscriptionId: string;
    ticketId?: string;
    woType: WorkOrderType;
    scheduledTime: Date;
    technicianId?: string;
}

export interface UpdateWorkOrderInput {
    technicianId?: string;
    scheduledTime?: Date;
    status?: WorkOrderStatus;
    customerSignatureUrl?: string;
}
