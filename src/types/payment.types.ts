export interface SnapTransactionResponse {
    token: string;
    redirect_url: string;
}

export interface MidtransNotification {
    transaction_status: string;
    order_id: string;
    status_code: string;      // Required for signature verification
    gross_amount: string;
    signature_key: string;
    fraud_status?: string;
    payment_type?: string;
    transaction_id?: string;
    approval_code?: string;
    settlement_time?: string;
}
