import FashionPageClient from "@/features/fashion/components/FashionPageClient";
import { getFashionProducts, getLookbook } from "@/lib/api/catalog";

export const dynamic = "force-dynamic";

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
        getLookbook(),
    ]);

    return (
        <FashionPageClient
            products={products}
            lookbookItems={lookbookItems}
            initialCategory={category}
        />
    );
}
