"use client";

import ExhibitionView from "./ExhibitionView";
import { useCartStore } from "@/features/cart/store/useCartStore";
import type { ArtPiece } from "@/shared/types";

interface ExhibitionPageClientProps {
    artworks: ArtPiece[];
}

export default function ExhibitionPageClient({ artworks }: ExhibitionPageClientProps) {
    const addArtToCart = useCartStore((state) => state.addArtToCart);

    const handleAddToCart = (art: ArtPiece) => {
        const result = addArtToCart(art);
        if (result === "already-in-cart") {
            // TODO: surface this as inline UI feedback (toast/banner) once the
            // shared notification/toast component exists.
            console.warn(`"${art.title}" is already in the cart.`);
        }
    };

    const handleSelectArtPiece = (art: ArtPiece) => {
        console.log("Selected art piece for detail view:", art.id);
    };

    return (
        <div className="w-full min-h-screen bg-[#0A0F2C] py-16 px-4 md:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-12 text-center">
                    <span className="text-xs font-semibold text-[#C9A84C] tracking-[0.45em] uppercase mb-3 block">
                        SADAF METAVERSE ATELIER &bull; المعرض التفاعلي
                    </span>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-white uppercase tracking-tight mb-2">
                        VIRTUAL{" "}
                        <span className="text-gold-gradient italic font-serif">Exhibition</span>
                    </h1>
                    <p className="text-xs md:text-sm text-slate-400 max-w-2xl mx-auto font-sans leading-relaxed">
                        Navigate through immersive curatorial rooms. Click artwork frames to inspect, listen to master narratives, and acquire authenticated heritage pieces directly.
                    </p>
                </div>
                <ExhibitionView
                    artworks={artworks}
                    onAddToCart={handleAddToCart}
                    onSelectArtPiece={handleSelectArtPiece}
                />
            </div>
        </div>
    );
}
