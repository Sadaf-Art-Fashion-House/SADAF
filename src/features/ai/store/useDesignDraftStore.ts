/**
 * SADAF | AI Studio — Design Draft Zustand Store
 *
 * Persists saved AI Studio designs (drafts) so the admin can later
 * review and publish them as products, artworks, or collections.
 *
 * Drafts are stored ephemerally in-memory during the session.
 * TODO: persist to localStorage or Supabase once the backend is wired.
 */

import { create } from 'zustand';
import type { AIClothingDesign } from '@/shared/types';
import type { DesignDraft, DraftStatus } from '../types';

interface DesignDraftState {
    /** All drafts, most recently saved first. */
    drafts: DesignDraft[];

    /** Save a configured AI design as a new draft. Returns the draft id. */
    saveDraft: (design: AIClothingDesign, selectedFabric: string, selectedPrinting: string, label?: string) => string;

    /** Update a draft's lifecycle status. */
    setDraftStatus: (draftId: string, status: DraftStatus) => void;

    /** Mark a draft as published and record the entity ID it was published as. */
    markDraftAsPublished: (draftId: string, entityId: string) => void;

    /** Remove a draft from the store entirely. */
    deleteDraft: (draftId: string) => void;

    /** Get drafts filtered by status. */
    getDraftsByStatus: (status: DraftStatus) => DesignDraft[];

    /** Remove all drafts. */
    clearAll: () => void;
}

function generateId(): string {
    return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export const useDesignDraftStore = create<DesignDraftState>((set, get) => ({
    drafts: [],

    saveDraft: (design, selectedFabric, selectedPrinting, label) => {
        const id = generateId();
        const draft: DesignDraft = {
            id,
            design,
            selectedFabric,
            selectedPrinting,
            savedAt: new Date().toISOString(),
            status: 'draft',
            label,
            publishedEntityIds: [],
        };
        set((state) => ({ drafts: [draft, ...state.drafts] }));
        return id;
    },

    setDraftStatus: (draftId, status) =>
        set((state) => ({
            drafts: state.drafts.map((d) =>
                d.id === draftId ? { ...d, status } : d
            ),
        })),

    markDraftAsPublished: (draftId, entityId) =>
        set((state) => ({
            drafts: state.drafts.map((d) =>
                d.id === draftId
                    ? { ...d, status: 'published' as const, publishedEntityIds: [...(d.publishedEntityIds || []), entityId] }
                    : d
            ),
        })),

    deleteDraft: (draftId) =>
        set((state) => ({
            drafts: state.drafts.filter((d) => d.id !== draftId),
        })),

    getDraftsByStatus: (status) => get().drafts.filter((d) => d.status === status),

    clearAll: () => set({ drafts: [] }),
}));
