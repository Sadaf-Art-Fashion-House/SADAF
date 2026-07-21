/**
 * SADAF | AI Studio — Design Publisher Service
 *
 * Converts a saved DesignDraft into one or more publishable catalog
 * entities (FashionProduct, ArtPiece, Collection).
 *
 * This is a stateless service class following the OOP pattern.
 * It mutates the shared data stores (fashionDatabase, artDatabase)
 * and the DesignDraft store itself.
 *
 * @example
 *   const publisher = new DesignPublisher();
 *   const result = publisher.publishAsFashion(draft);
 *   // → { draftId, targetType: 'fashion', entityId: 'f-...', entityName: '...' }
 */

import type { AIClothingDesign, ArtPiece, Collection } from '@/shared/types';
import type { FashionProduct } from '@/types';
import type { DesignDraft, PublishResult } from '../types';
import { useDesignDraftStore } from '../store/useDesignDraftStore';
import { fashionDatabase, artDatabase } from '@/data';
import { collections } from '@/data';

/** Mappings from AI clothing types to fashion categories. */
const CLOTHING_TO_CATEGORY: Record<string, string> = {
    Abaya: 'Traditional Fusion',
    Hoodie: 'Limited Edition',
    'T-Shirt': 'Men',
    Jacket: 'Women',
    Streetwear: 'Limited Edition',
};

/** Mappings from AI printing options to fashion details. */
const PRINTING_TO_DETAIL: Record<string, string> = {
    DTG: 'Direct-to-Garment micro-spray printed pattern',
    Embroidery: 'Hand-crafted gold-thread embroidery detailing',
    'Screen Print': 'Artisanal layered screen-printed metallic ink',
    'Puff Print': 'High-rising velvet-embossed puff print texture',
};

function generateId(prefix: string): string {
    return `${prefix}-${Date.now()}`;
}

function designToFashionProduct(design: AIClothingDesign, selectedFabric: string, selectedPrinting: string): FashionProduct {
    return {
        id: generateId('f'),
        name: design.patternName || 'AI-Designed Creation',
        category: CLOTHING_TO_CATEGORY[design.clothingType] || 'Limited Edition',
        price: 680,
        image: '',
        hoverImage: '',
        description: design.description || `An exclusive ${design.clothingType} designed through AI Studio.`,
        fabric: selectedFabric || 'Premium Raw Silk',
        sizes: ['S', 'M', 'L', 'XL'],
        colors: [
            { name: 'Primary', hex: design.primaryColor || '#0A0F2C' },
            { name: 'Accent', hex: design.accentColor || '#C9A84C' },
        ],
        details: [
            `AI-generated pattern: ${design.patternName}`,
            PRINTING_TO_DETAIL[selectedPrinting] || 'Bespoke custom print',
            '100% hand-finished stitching in Cairo atelier',
            'Limited edition AI Studio creation',
        ],
        rating: 4.8,
    } as FashionProduct;
}

function designToArtPiece(design: AIClothingDesign): ArtPiece {
    return {
        id: generateId('art'),
        title: design.patternName || 'AI-Generated Art Composition',
        category: 'Digital Art',
        artist: 'SADAF AI Studio / Gemini Neural Pipeline',
        price: 1200,
        image: '',
        description: design.story || design.description || 'A digital artwork generated through SADAF AI Studio, combining traditional Islamic geometric patterns with contemporary digital aesthetics.',
        dimensions: '100 x 100 cm (Digital Canvas)',
        year: new Date().getFullYear().toString(),
        medium: 'Generative AI / Digital Pigment Print',
    };
}

function designsToCollection(designs: AIClothingDesign[], name: string, tagline: string): Collection {
    return {
        id: generateId('c'),
        name,
        tagline: tagline || 'AI Curated by SADAF Studio',
        image: '',
        year: new Date().getFullYear().toString(),
        description: `A curated collection of ${designs.length} AI-generated designs, blending heritage motifs with computational creativity.`,
    };
}

/**
 * Stateless publisher service.
 * All methods return a PublishResult and mutate the shared data sources.
 */
export class DesignPublisher {
    /**
     * Publish a draft as a FashionProduct.
     * Adds to fashionDatabase and marks the draft as published.
     */
    publishAsFashion(draft: DesignDraft): PublishResult {
        const product = designToFashionProduct(draft.design, draft.selectedFabric, draft.selectedPrinting);
        fashionDatabase.unshift(product as FashionProduct);

        const store = useDesignDraftStore.getState();
        store.markDraftAsPublished(draft.id, product.id);

        return {
            draftId: draft.id,
            targetType: 'fashion',
            entityId: product.id,
            entityName: product.name,
        };
    }

    /**
     * Publish a draft as an ArtPiece.
     * Adds to artDatabase and marks the draft as published.
     */
    publishAsArt(draft: DesignDraft): PublishResult {
        const art = designToArtPiece(draft.design);
        artDatabase.unshift(art);

        const store = useDesignDraftStore.getState();
        store.markDraftAsPublished(draft.id, art.id);

        return {
            draftId: draft.id,
            targetType: 'art',
            entityId: art.id,
            entityName: art.title,
        };
    }

    /**
     * Publish multiple drafts as a Collection.
     * Adds to collections array and marks all drafts as published.
     */
    publishAsCollection(drafts: DesignDraft[], collectionName: string, tagline: string): PublishResult {
        const designs = drafts.map((d) => d.design);
        const collection = designsToCollection(designs, collectionName, tagline);
        collections.unshift(collection);

        const store = useDesignDraftStore.getState();
        for (const draft of drafts) {
            store.markDraftAsPublished(draft.id, collection.id);
        }

        return {
            draftId: drafts.map((d) => d.id).join(','),
            targetType: 'collection',
            entityId: collection.id,
            entityName: collection.name,
        };
    }
}

/** Singleton instance for convenience. */
export const designPublisher = new DesignPublisher();
