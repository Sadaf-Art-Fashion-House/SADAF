import type { Metadata } from 'next';
import AtelierPageClient from '@/features/atelier/components/AtelierPageClient';

export const metadata: Metadata = {
    title: 'Atelier | SADAF Design Workshop',
    description: 'Explore the SADAF atelier — premium fabrics, printing methods, and the art of hand-crafted luxury fashion.',
};

export default function AtelierPage() {
    return <AtelierPageClient />;
}
