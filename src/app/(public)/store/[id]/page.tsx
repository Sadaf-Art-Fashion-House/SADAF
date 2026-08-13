import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductPageClient from '@/features/marketplace/components/ProductPageClient';
import type { FashionProduct } from '@/shared/types';
import type { Review } from '@/features/reviews/types';
import { getMockReviews } from '@/features/reviews/data/mockReviews';
import { fashionDatabase } from '@/data';

/**
 * Product Detail Page — Server Component.
 * Fetches the product by id from the static catalog and renders the client
 * view. 404 when the id is unknown. Related products (same category,
 * excluding this one) and the product's catalog reviews are resolved here so
 * all data fetching stays on the server; the client merges the user's own
 * reviews and wires cart/wishlist actions.
 */

interface StoreProductPageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: StoreProductPageProps): Promise<Metadata> {
    const { id } = await params;
    const product = fashionDatabase.find((p) => p.id === id);
    return {
        title: product ? `${product.name} | SADAF Atelier` : 'Product | SADAF Atelier',
        description: product?.description ?? 'SADAF boutique archive.',
    };
}

export default async function StoreProductPage({ params }: StoreProductPageProps) {
    const { id } = await params;
    const product = fashionDatabase.find((p) => p.id === id);

    if (!product) notFound();

    // Same-category first, then other pieces to fill the trio — the catalog
    // currently has one product per category, so same-category alone is
    // often empty.
    const sameCategory = fashionDatabase.filter(
        (p) => p.id !== product.id && p.category === product.category,
    );
    const otherPieces = fashionDatabase.filter(
        (p) => p.id !== product.id && p.category !== product.category,
    );
    const relatedProducts: FashionProduct[] = [...sameCategory, ...otherPieces].slice(0, 3);

    // Catalog reviews — merged with the user's own reviews (localStorage) on
    // the client. The full set is passed so the main product's summary AND
    // the related-product cards all show their own aggregated ratings (the
    // client filters per product by id/name).
    const mockReviews: Review[] = getMockReviews();

    return (
        <ProductPageClient
            product={product}
            relatedProducts={relatedProducts}
            mockReviews={mockReviews}
        />
    );
}
