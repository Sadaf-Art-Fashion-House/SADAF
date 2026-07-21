import type { Metadata } from 'next';
import CheckoutPageClient from '@/features/checkout/components/CheckoutPageClient';

export const metadata: Metadata = {
    title: 'Secure Checkout | SADAF Atelier',
    description:
        'Complete your SADAF order — enter shipping details, choose a payment method, and confirm your bespoke luxury purchase.',
};

export default function CheckoutPage() {
    return <CheckoutPageClient />;
}
