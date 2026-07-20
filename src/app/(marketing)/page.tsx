import HomePageClient from "@/features/home/components/HomePageClient";
import type { Collection, ArtPiece, FashionProduct } from '@/shared/types';
// TODO: replace with your real Supabase queries once you wire this feature's data layer
async function getFeaturedProducts(): Promise<FashionProduct[]> {
    return [];
}
async function getFeaturedArtwork(): Promise<ArtPiece[]> {
    return [];
}
async function getCollections(): Promise<Collection[]> {
    return [];
}

export default async function HomePage() {
    const [featuredProducts, featuredArtwork, collections] = await Promise.all([
        getFeaturedProducts(),
        getFeaturedArtwork(),
        getCollections(),
    ]);

    return (
        <HomePageClient
            featuredProducts={featuredProducts}
            featuredArtwork={featuredArtwork}
            collections={collections}
        />
    );
}