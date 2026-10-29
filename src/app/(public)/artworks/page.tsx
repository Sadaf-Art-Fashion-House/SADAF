import ArtworksPageClient from "@/features/artworks/components/ArtworksPageClient";
import { getArtworks } from "@/lib/api/catalog";

export const dynamic = "force-dynamic";

export default async function ArtworksPage() {
    const artworks = await getArtworks();

    return <ArtworksPageClient artworks={artworks} />;
}
