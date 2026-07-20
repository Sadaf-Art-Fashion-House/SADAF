import ArtworksPageClient from "@/features/artworks/components/ArtworksPageClient";
import type { ArtPiece } from "@/shared/types";
import { artDatabase } from "@/data";

// TODO: replace with real Supabase query once artworks data layer is wired.
// artDatabase from @/data is the static fallback until then (matches the
// pattern used by the Fashion feature's fashionDatabase).
async function getArtworks(): Promise<ArtPiece[]> {
  return artDatabase;
}

export default async function ArtworksPage() {
  const artworks = await getArtworks();

  return <ArtworksPageClient artworks={artworks} />;
}