export interface CreateActivityLogData {
    actorUserId: string;
    action: string;
    targetTable: string;
    targetId: string;
    oldValue?: any;
    newValue?: any;
    ipAddress: string;
}

export interface ActivityLogFilters {
    actorUserId?: string;
    action?: string;
    targetTable?: string;
    targetId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
}
