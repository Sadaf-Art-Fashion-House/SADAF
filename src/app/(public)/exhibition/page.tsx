import ExhibitionPageClient from "@/features/exhibition/components/ExhibitionPageClient";
import { artDatabase } from "@/data";

export const metadata = {
    title: "Virtual Exhibition | SADAF Metaverse Atelier",
    description:
        "Explore immersive curatorial rooms featuring authentic Egyptian heritage art — from Fatimid geometry to Alexandrian calligraphy.",
};

export default function ExhibitionPage() {
    return <ExhibitionPageClient artworks={artDatabase} />;
}
