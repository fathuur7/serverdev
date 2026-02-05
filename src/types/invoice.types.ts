export interface GenerateInvoiceInput {
    subscriptionId: string;
    billingPeriod?: Date; // Defaults to now
}

export interface InvoiceFilters {
    subscriptionId?: string;
    status?: string;
    page?: number;
    limit?: number;
}
