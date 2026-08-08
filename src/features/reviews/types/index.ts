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
    /**
     * Set for reviews written from an order — used to keep one review per
     * delivered order and to mark the order as reviewed in the UI.
     */
    orderId?: string;
}

export type ReviewSortOption = 'newest' | 'highest' | 'lowest';
