import ExhibitionPageClient from "@/features/exhibition/components/ExhibitionPageClient";
import { getArtworks } from "@/lib/api/catalog";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "Virtual Exhibition | SADAF Metaverse Atelier",
    description:
        "Explore immersive curatorial rooms featuring authentic Egyptian heritage art — from Fatimid geometry to Alexandrian calligraphy.",
};

export default async function ExhibitionPage() {
    const artworks = await getArtworks();

    return <ExhibitionPageClient artworks={artworks} />;
}
