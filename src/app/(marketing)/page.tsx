import HomePageClient from "@/features/home/components/HomePageClient";
import type { Collection, ArtPiece, FashionProduct } from '@/shared/types';
// Static fallback from the shared catalog until the Supabase data layer is
// wired — same pattern as the Store/Fashion/Artworks pages.
import { fashionDatabase, artDatabase, collections } from '@/data';

async function getFeaturedProducts(): Promise<FashionProduct[]> {
    return fashionDatabase;
}
async function getFeaturedArtwork(): Promise<ArtPiece[]> {
    return artDatabase;
}
async function getCollections(): Promise<Collection[]> {
    return collections;
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