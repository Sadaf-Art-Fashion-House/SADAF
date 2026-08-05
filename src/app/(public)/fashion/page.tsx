import FashionPageClient from "@/features/fashion/components/FashionPageClient";
import type { FashionProduct, LookbookItem } from "@/shared/types";
import { fashionDatabase, lookbookItems as staticLookbookItems } from "@/data";

// TODO: Replace with real Supabase query once the fashion data layer is wired.
// The fashionDatabase import from @/data is the static fallback until then.
async function getFashionProducts(): Promise<FashionProduct[]> {
    return fashionDatabase;
}

// TODO: Replace with a Supabase/CMS query once lookbook content is managed dynamically.
// For now, static data from @/data serves as the source of truth.
async function getLookbookItems(): Promise<LookbookItem[]> {
    return staticLookbookItems;
}

export const metadata = {
    title: "Fashion Collection | SADAF Atelier",
    description:
        "Unveil garments tailored with super-140s Egyptian wool, raw coastal silks, and 18k gold embroideries. Browse traditional fusion lines, outerwear, and limited drops.",
};

interface FashionPageProps {
    searchParams: Promise<{ category?: string }>;
}

export default async function FashionPage({ searchParams }: FashionPageProps) {
    const { category } = await searchParams;

    const [products, lookbookItems] = await Promise.all([
        getFashionProducts(),
        getLookbookItems(),
    ]);

    return (
        <FashionPageClient
            products={products}
            lookbookItems={lookbookItems}
            initialCategory={category}
        />
    );
}
