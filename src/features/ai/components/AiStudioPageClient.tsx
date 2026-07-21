'use client';

import { useCallback, useState } from 'react';
import { useAiStudio } from '@/features/ai/hooks/useAiStudio';
import { useDesignDraftStore } from '@/features/ai/store/useDesignDraftStore';
import type { AIClothingDesign } from '@/shared/types';
import AiStudioView from './AiStudioView';
import SavedDesignsPanel from './SavedDesignsPanel';

export default function AiStudioPageClient() {
    const studio = useAiStudio();
    const [showSavedDesigns, setShowSavedDesigns] = useState(false);
    const { saveDraft, drafts } = useDesignDraftStore();
    const draftCount = drafts.filter((d) => d.status === 'draft').length;

    const handleSaveDesign = useCallback(() => {
        saveDraft(
            {
                ...studio.activeDesign,
                primaryColor: studio.baseColor,
                printingOption: studio.selectedPrinting as AIClothingDesign['printingOption'],
                fabrics: [studio.selectedFabric, ...studio.activeDesign.fabrics],
            },
            studio.selectedFabric,
            studio.selectedPrinting,
            undefined,
        );
    }, [studio, saveDraft]);

    return (
        <>
            <AiStudioView
                {...studio}
                onSaveDesign={handleSaveDesign}
                onViewSavedDesigns={() => setShowSavedDesigns(true)}
                savedDraftsCount={draftCount}
            />

            {showSavedDesigns && (
                <SavedDesignsPanel onClose={() => setShowSavedDesigns(false)} />
            )}
        </>
    );
}
