"use client";

import ArtsView from "./ArtsView";
import { useCartStore } from "@/features/cart/store/useCartStore";
import type { ArtPiece } from "@/shared/types";

interface ArtworksPageClientProps {
    artworks: ArtPiece[];
}

export default function ArtworksPageClient({ artworks }: ArtworksPageClientProps) {
    const addArtToCart = useCartStore((state) => state.addArtToCart);

    const handleAddToCart = (art: ArtPiece) => {
        // Art pieces are one-of-a-kind — the store reports back whether the
        // piece was already in the cart so the UI can react (see TODO below).
        const result = addArtToCart(art);
        if (result === "already-in-cart") {
            // TODO: surface this as inline UI feedback (toast/banner) once the
            // shared notification/toast component exists — no such component
            // is built yet in src/shared/ui.
            console.warn(`"${art.title}" is already in the cart.`);
        }
    };

    // TODO: replace with real detail modal/drawer once that UI component exists
    const handleSelectArtPiece = (art: ArtPiece) => {
        console.log("Selected art piece for detail view:", art.id);
    };

    return (
        <ArtsView
            artworks={artworks}
            onAddToCart={handleAddToCart}
            onSelectArtPiece={handleSelectArtPiece}
        />
    );
}