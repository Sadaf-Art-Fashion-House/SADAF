/**
 * Checkout-specific types for the SADAF checkout flow.
 *
 * The core CartItem type lives in @/shared/types.
 * This file holds types that are ONLY used within the Checkout feature.
 */

/** Shipping address collected during checkout. */
export interface ShippingAddress {
    fullName: string;
    email: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
}

/** Supported payment method options. */
export type PaymentMethod = 'credit-card' | 'paypal' | 'bank-transfer';

/** Metadata for the selected payment method. */
export interface PaymentInfo {
    method: PaymentMethod;
    /** Masked card number (e.g. "•••• 4242") — only for credit-card method. */
    cardLastFour?: string;
    /** Cardholder name — only for credit-card method. */
    cardHolderName?: string;
    /** Expiry date — only for credit-card method. */
    expiryDate?: string;
    /** PayPal email address — only for paypal method. */
    paypalEmail?: string;
    /** Bank name — only for bank-transfer method. */
    bankName?: string;
    /** Bank account number — only for bank-transfer method. */
    bankAccountNumber?: string;
}

/** Full order payload submitted after successful checkout. */
export interface OrderPayload {
    id: string;
    shippingAddress: ShippingAddress;
    paymentInfo: PaymentInfo;
    items: {
        name: string;
        quantity: number;
        totalPrice: number;
        type: string;
    }[];
    subtotal: number;
    shippingFee: number;
    total: number;
    createdAt: string;
    status: 'confirmed' | 'processing' | 'shipped' | 'delivered';
}

/** Step in the checkout flow. */
export type CheckoutStep = 'shipping' | 'review' | 'confirmation';
