import MarketplacePageClient from "@/features/marketplace/components/MarketplacePageClient";
import type { FashionProduct } from "@/shared/types";
import { fashionDatabase } from "@/data";

// TODO: Replace with a real Supabase query once the marketplace data layer
// is wired. The fashionDatabase import from @/data is the static fallback
// until then (the Vite prototype's Store view reused the same catalog).
async function getMarketplaceProducts(): Promise<FashionProduct[]> {
    return fashionDatabase;
}

export const metadata = {
    title: "Boutique Store | SADAF Atelier",
    description:
        "Shop the SADAF boutique archive — luxury ready-to-wear pieces across women's, men's, kids', and limited edition lines, with VIP coupon pricing at checkout.",
};

export default async function StorePage() {
    const products = await getMarketplaceProducts();

    return <MarketplacePageClient products={products} />;
}
