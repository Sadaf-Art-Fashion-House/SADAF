/**
 * SADAF | Art & Fashion House TypeScript Definitions
 * Highly-curated type safety for the luxury platform.
 */

export type ArtCategory = 'Handmade' | 'Oil Paintings' | 'Calligraphy' | 'Digital Art' | 'Fashion Sketches';

export interface ArtPiece {
  id: string;
  title: string;
  category: ArtCategory;
  artist: string;
  price: number;
  image: string;
  description: string;
  dimensions: string;
  year: string;
  medium: string;
}

export type FashionCategory = 'Women' | 'Men' | 'Kids' | 'Traditional Fusion' | 'Limited Edition';

export interface FashionProduct {
  id: string;
  name: string;
  category: FashionCategory;
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

export interface AIClothingDesign {
  prompt: string;
  clothingType: 'Hoodie' | 'T-Shirt' | 'Abaya' | 'Jacket' | 'Streetwear';
  primaryColor: string;
  svgPattern: string; // Dynamic path/pattern details
  accentColor: string;
  patternName: string;
  description: string;
  story: string; // Gemini generated narrative
  fabrics: string[];
  printingOption: 'DTG' | 'Embroidery' | 'Screen Print' | 'Puff Print';
}

export interface MaqasaqRecommendation {
  size: string;
  confidence: number;
  measurements: {
    chest: number;
    shoulder: number;
    length: number;
    waist: number;
  };
  comment: string;
}

export interface CartItem {
  id: string; // Unique instance id
  product?: FashionProduct; // If normal store product
  artPiece?: ArtPiece; // If art product
  aiCustomDesign?: AIClothingDesign; // If AI customized apparel
  quantity: number;
  selectedSize: string;
  selectedColor?: string;
  selectedFabric?: string;
  selectedPrinting?: string;
  totalPrice: number;
}

export interface OrderStats {
  id: string;
  status: 'Pending' | 'Tailoring' | 'Shipped' | 'Delivered';
  date: string;
  items: CartItem[];
  shippingAddress: string;
  subtotal: number;
  tax: number;
  total: number;
}

export interface Collection {
  id: string;
  name: string;
  tagline: string;
  image: string;
  year: string;
  description: string;
}
