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

export interface LookbookItem {
    id: string;
    title: string;
    subtitle: string;
    image: string;
    year: string;
    description: string;
}
