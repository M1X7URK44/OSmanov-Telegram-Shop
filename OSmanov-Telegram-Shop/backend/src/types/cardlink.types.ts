// backend/src/types/cardlink.types.ts
export interface CardLinkCreatePaymentRequest {
  amount: number;
  order_id: string;
  description: string;
  user_id: number;
  success_url?: string;
  fail_url?: string;
  payer_pays_commission?: 0 | 1; // 0 или 1 - кто оплачивает комиссию за входящий платёж
}

export interface CardLinkCreatePaymentResponse {
  success: boolean;
  link_url?: string;
  link_page_url?: string;
  bill_id?: string;
  error?: string;
}

export interface CardLinkStatusResponse {
  success: boolean;
  is_paid?: boolean;
  is_failed?: boolean;
  is_processing?: boolean;
  status?: string;
  error?: string;
}

export interface CardLinkWebhookPayload {
  InvId: string;
  OutSum: string;
  Commission: string;
  TrsId: string;
  Status: 'SUCCESS' | 'UNDERPAID' | 'OVERPAID' | 'FAIL';
  CurrencyIn: string;
  custom?: string;
  SignatureValue: string;
}