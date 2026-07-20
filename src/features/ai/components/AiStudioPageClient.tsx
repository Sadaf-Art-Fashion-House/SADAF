'use client';

import { useAiStudio } from '@/features/ai/hooks/useAiStudio';
import AiStudioView from './AiStudioView';

export default function AiStudioPageClient() {
    const studio = useAiStudio();

    return <AiStudioView {...studio} />;
}
