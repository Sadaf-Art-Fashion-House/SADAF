import { getFashionProducts, getArtworks } from '../../lib/supabase';
import { getFallbackCatalog } from '../services/catalogService';

export async function fetchCatalogData() {
    try {
        const [fashionResponse, artworkResponse] = await Promise.all([getFashionProducts(), getArtworks()]);
        const products = fashionResponse && fashionResponse.length > 0 ? fashionResponse : getFallbackCatalog().products;
        const artworks = artworkResponse && artworkResponse.length > 0 ? artworkResponse : getFallbackCatalog().artworks;
        return {
            products: products.map((item: any) => ({ ...item, image: item.image_url ?? item.image, hoverImage: item.hover_image ?? item.hoverImage })),
            artworks: artworks.map((item: any) => ({ ...item, image: item.image_url ?? item.image, title: item.name ?? item.title }))
        };
    } catch (error) {
        console.error(error);
        return getFallbackCatalog();
    }
}
