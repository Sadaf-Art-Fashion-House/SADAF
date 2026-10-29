import MarketplacePageClient from "@/features/marketplace/components/MarketplacePageClient";
import { getMockReviews } from "@/features/reviews/data/mockReviews";
import { getFashionProducts } from "@/lib/api/catalog";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "Boutique Store | SADAF Atelier",
    description:
        "Shop the SADAF boutique archive — luxury ready-to-wear pieces across women's, men's, kids', and limited edition lines, with VIP coupon pricing at checkout.",
};

export default async function StorePage() {
    const products = await getFashionProducts();
    // Catalog reviews feed the aggregated card ratings (merged with the
    // signed-in user's own reviews client-side — see useAggregatedRatings).
    const mockReviews = getMockReviews();

    return (
        <MarketplacePageClient
            products={products}
            mockReviews={mockReviews}
        />
    );
}
