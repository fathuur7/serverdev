import { SubscriptionStatus } from "@prisma/client";

// Input for creating a new subscription
export interface CreateSubscriptionInput {
    customerId: string;
    packageId: string;
    installationAddressFull: string;
    geoLat: number;
    geoLong: number;
    photoHomeCustomer: string;
    activationDate?: string; // ISO Date String
}

// Input for updating subscription (address/geo only)
export interface UpdateSubscriptionInput {
    installationAddressFull?: string;
    geoLat?: number;
    geoLong?: number;
}

// Filters for listing subscriptions
export interface SubscriptionFilters {
    status?: SubscriptionStatus;
    customerId?: string;
    packageId?: string;
    page?: number;
    limit?: number;
}

// Response with pagination
export interface PaginatedSubscriptions {
    data: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}


export interface UpgradeSubscriptionInput {
    subscriptionId: string;
    newPackageId: string;
}
