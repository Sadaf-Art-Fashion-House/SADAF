export interface ArtPiece {
    id: string;
    title: string;
    /** Arabic display title for the bilingual catalog — falls back to `title` when absent. */
    titleAr?: string;
    category: string;
    artist: string;
    price: number;
    image: string;
    description: string;
    /** Arabic display description — falls back to `description` when absent. */
    descriptionAr?: string;
    dimensions: string;
    year: string;
    medium: string;
}
