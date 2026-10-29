import HomePageClient from "@/features/home/components/HomePageClient";
import { getArtworks, getCollections, getFashionProducts } from "@/lib/api/catalog";

export const dynamic = "force-dynamic";

export default async function HomePage() {
    const [featuredProducts, featuredArtwork, collections] = await Promise.all([
        getFashionProducts(),
        getArtworks(),
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
