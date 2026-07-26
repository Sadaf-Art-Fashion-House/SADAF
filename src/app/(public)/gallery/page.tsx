import GalleryPageClient from "@/features/gallery/components/GalleryPageClient";
import { GALLERY_ITEMS } from "@/features/gallery/constants/galleryItems";

export const metadata = {
    title: "Visual Archive | SADAF Atelier",
    description:
        "The SADAF visual archive — cinematic campaign lookbooks, artisan studies, and architecture photography from Cairo and Alexandria.",
};

export default function GalleryPage() {
    return <GalleryPageClient galleryItems={GALLERY_ITEMS} />;
}
