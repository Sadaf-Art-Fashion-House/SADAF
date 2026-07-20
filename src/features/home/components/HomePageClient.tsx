"use client";

import HomeView from "./HomeView";
import type { Collection, ArtPiece, FashionProduct } from "@/shared/types";

interface HomePageClientProps {
    featuredProducts: FashionProduct[];
    featuredArtwork: ArtPiece[];
    collections: Collection[];
}

export default function HomePageClient({ featuredProducts, featuredArtwork, collections }: HomePageClientProps) {
    return (
        <HomeView
            featuredProducts={featuredProducts}
            featuredArtwork={featuredArtwork}
            collections={collections}
        />
    );
}