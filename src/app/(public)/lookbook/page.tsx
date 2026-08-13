import type { Metadata } from "next";
import LookbookPageClient from "@/features/lookbook/components/LookbookPageClient";
import type { LookbookItem } from "@/shared/types";
import { lookbookItems as staticLookbookItems } from "@/data";

// TODO: Replace with a Supabase/CMS query once lookbook content is managed
// dynamically. For now, static data from @/data serves as the source of truth.
async function getLookbookItems(): Promise<LookbookItem[]> {
    return staticLookbookItems;
}

export const metadata: Metadata = {
    title: "Lookbook | SADAF Atelier",
    description:
        "A cinematic journey through the SADAF archive — couture campaigns, limited drops, and the stories behind every silhouette.",
};

export default async function LookbookPage() {
    const lookbookItems = await getLookbookItems();

    return <LookbookPageClient lookbookItems={lookbookItems} />;
}
