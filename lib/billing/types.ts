import { BILLING_ERROR_CODE } from "@/lib/stripe/config";

export type BillingServiceError = {
  success: false;
  error: string;
  code?: (typeof BILLING_ERROR_CODE)[keyof typeof BILLING_ERROR_CODE];
  redirectTo?: string;
};

export type BillingServiceSuccess<T> = {
  success: true;
  data: T;
};

export type BillingServiceResult<T> =
  | BillingServiceSuccess<T>
  | BillingServiceError;

export type EmpresaBillingStatus = {
  role: "empresa";
  status: string;
  ready: boolean;
  paymentMethod: {
    brand: string | null;
    last4: string | null;
    expMonth: number | null;
    expYear: number | null;
  } | null;
};

export type TransportistaBillingStatus = {
  role: "transportista";
  status: string;
  ready: boolean;
  payoutsEnabled: boolean;
  connectPayoutLast4: string | null;
};

export type BillingStatusPayload =
  | EmpresaBillingStatus
  | TransportistaBillingStatus;
