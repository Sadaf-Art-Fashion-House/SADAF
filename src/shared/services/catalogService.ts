import { artDatabase, fashionDatabase } from '../../data';
import type { ArtPiece, FashionProduct } from '../../types';

export function getFallbackCatalog() {
    return {
        products: fashionDatabase as FashionProduct[],
        artworks: artDatabase as ArtPiece[]
    };
}
