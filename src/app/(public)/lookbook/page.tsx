import type { Metadata } from "next";
import LookbookPageClient from "@/features/lookbook/components/LookbookPageClient";
import { getLookbook } from "@/lib/api/catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Lookbook | SADAF Atelier",
    description:
        "A cinematic journey through the SADAF archive — couture campaigns, limited drops, and the stories behind every silhouette.",
};

export default async function LookbookPage() {
    const lookbookItems = await getLookbook();

    return <LookbookPageClient lookbookItems={lookbookItems} />;
}
