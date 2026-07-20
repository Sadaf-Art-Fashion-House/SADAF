import type { GalleryItem } from "../types";

/**
 * Static visual-archive catalog for the Gallery feature.
 * Extracted from the Vite prototype's GalleryView (it previously hardcoded
 * this array inline). Local Figma-mockup assets live under /public/assets/images
 * so they're referenced as root-relative paths; all other shots are hosted
 * on images.unsplash.com (already whitelisted in next.config.ts).
 */
export const GALLERY_ITEMS: GalleryItem[] = [
    {
        id: "gal-1",
        src: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=82",
        category: "Couture Campaigns",
        title: "Al-Muizz Shadows in Dusk Velvet",
        photographer: "Youssef Nabil",
        location: "Gayer-Anderson Palace, Cairo",
        campaign: "Al-Muizz Couture 2026",
    },
    {
        id: "gal-2",
        src: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1200&q=82",
        category: "Couture Campaigns",
        title: "Iridescent Seaside Drapery",
        photographer: "Karin Al-Fayed",
        location: "Alexandria Royal Terraces",
        campaign: "Sadaf Mother of Pearl 2026",
    },
    {
        id: "gal-3",
        src: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1000&q=82",
        category: "Artisan Studies",
        title: "Charcoal Drapery and Ink Outlines",
        photographer: "Sadaf Atelier Curator",
        location: "Sadaf Lab Atelier, old Cairo",
        campaign: "The Diwani Script studies",
    },
    {
        id: "gal-4",
        src: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=1000&q=82",
        category: "Artisan Studies",
        title: "Gold Foil Calligraphy Stroke Study",
        photographer: "Nour Hammad",
        location: "Fouad Atelier, Alexandria",
        campaign: "Gilded Calligraphy",
    },
    {
        id: "gal-5",
        src: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1000&q=82",
        category: "Architecture Shadows",
        title: "Intersecting Fatimid Geometries in Sandstone",
        photographer: "Tariq Al-Hussein",
        location: "Al-Hakim Mosque, Cairo",
        campaign: "Islamic Star Constellations",
    },
    {
        id: "gal-6",
        src: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1000&q=82",
        category: "Couture Campaigns",
        title: "Bedouin Gilded Cape study in Motion",
        photographer: "Youssef Nabil",
        location: "Siwa Oasis Sands",
        campaign: "Al-Muizz Couture 2026",
    },
    {
        id: "figma-1",
        src: "/assets/images/cairo_geometry_room_figma_1779934153159.png",
        category: "Figma UX Mockups",
        title: "3D Virtual Museum Stage Blueprint",
        photographer: "SADAF Lead UI Designer",
        location: "Cairo Geometry Room UX Layout",
        campaign: "Figma Design System",
    },
    {
        id: "figma-2",
        src: "/assets/images/ai_studio_design_figma_1779934171967.png",
        category: "Figma UX Mockups",
        title: "SADAF AI Creative Atelier Panel",
        photographer: "SADAF Creative Tech Director",
        location: "Generative Clothing Studio Canvas",
        campaign: "Figma Design System",
    },
    {
        id: "figma-3",
        src: "/assets/images/store_figma_mockup_1779938205187.png",
        category: "Figma UX Mockups",
        title: "SADAF Boutique E-Commerce Grid",
        photographer: "SADAF Lead UI Designer",
        location: "SADAF Boutique Store Layout",
        campaign: "Figma Design System",
    },
    {
        id: "figma-4",
        src: "/assets/images/lookbook_figma_mockup_1779938224411.png",
        category: "Figma UX Mockups",
        title: "Aesthetic Editorial Lookbook Capsule",
        photographer: "SADAF Art Director",
        location: "SADAF Cinematic Lookbook Grid",
        campaign: "Figma Design System",
    },
];
