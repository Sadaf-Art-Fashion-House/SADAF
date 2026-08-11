export interface Collection {
    id: string;
    name: string;
    tagline: string;
    image: string;
    year: string;
    description: string;
}

export interface CartItem {
    id: string;
    product?: FashionProduct;
    artPiece?: ArtPiece;
    aiCustomDesign?: AIClothingDesign;
    quantity: number;
    selectedSize: string;
    selectedColor?: string;
    selectedFabric?: string;
    selectedPrinting?: string;
    totalPrice: number;
}

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
    dimensions: string;
    year: string;
    medium: string;
}

export interface FashionProduct {
    id: string;
    name: string;
    category: string;
    price: number;
    image: string;
    hoverImage: string;
    description: string;
    fabric: string;
    sizes: string[];
    colors: { name: string; hex: string }[];
    details: string[];
    rating: number;
}

export interface AIClothingDesign {
    prompt: string;
    clothingType: string;
    primaryColor: string;
    svgPattern: string;
    accentColor: string;
    patternName: string;
    description: string;
    story: string;
    fabrics: string[];
    printingOption: string;
}
