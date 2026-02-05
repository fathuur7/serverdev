export interface SnapTransactionResponse {
    token: string;
    redirect_url: string;
}

export interface MidtransNotification {
    transaction_status: string;
    order_id: string;
    gross_amount: string;
    signature_key: string;
    fraud_status?: string;
}
