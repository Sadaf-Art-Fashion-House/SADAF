import type { Metadata } from 'next';
import AiStudioPageClient from '@/features/ai/components/AiStudioPageClient';

export const metadata: Metadata = {
    title: 'AI Studio | SADAF Couture Laboratory',
    description: 'Design bespoke AI-generated fashion with the SADAF AI Studio.',
};

export default function AiStudioPage() {
    return <AiStudioPageClient />;
}
