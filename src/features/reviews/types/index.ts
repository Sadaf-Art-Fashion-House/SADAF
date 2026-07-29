/**
 * SADAF | Reviews Feature — Type Definitions
 */

export interface Review {
    id: string;
    productId: string;
    productName: string;
    productImage: string;
    productHref: string;
    userName: string;
    userAvatar?: string;
    rating: number; // 1–5
    title: string;
    comment: string;
    createdAt: string;
    verified: boolean;
}

export type ReviewSortOption = 'newest' | 'highest' | 'lowest';
