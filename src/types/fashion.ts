export interface FashionProduct {
    id: string;
    name: string;
    /** Arabic display name for the bilingual catalog — falls back to `name` when absent. */
    nameAr?: string;
    category: string;
    price: number;
    image: string;
    hoverImage: string;
    description: string;
    /** Arabic product description — falls back to `description` when absent. */
    descriptionAr?: string;
    fabric: string;
    /** Arabic fabric label — falls back to `fabric` when absent. */
    fabricAr?: string;
    sizes: string[];
    colors: { name: string; nameAr?: string; hex: string }[];
    details: string[];
    /** Arabic bullet-point details — falls back to `details` when absent. */
    detailsAr?: string[];
    rating: number;
    /** Complete Arabic text block — bilingual data layer (ADR-0001). */
    i18n?: { name: string; description: string; fabric: string; details: string[] };
}

export interface LookbookItem {
    id: string;
    title: string;
    subtitle: string;
    image: string;
    year: string;
    description: string;
    /** Arabic display title — falls back to `title` when absent. */
    titleAr?: string;
    /** Arabic display subtitle — falls back to `subtitle` when absent. */
    subtitleAr?: string;
    /** Arabic display description — falls back to `description` when absent. */
    descriptionAr?: string;
}
