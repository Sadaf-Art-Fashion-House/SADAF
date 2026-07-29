import type { Metadata } from 'next';
import SearchPageClient from '@/features/search/components/SearchPageClient';
import type { SearchResult } from '@/features/search/types';

export const metadata: Metadata = {
    title: 'Search | SADAF Atelier',
    description: 'Search across fashion, artworks, and collections at SADAF.',
};

/**
 * Mock search data — returns all products/arts/collections so the search
 * UI functions with real content. Replace with Supabase full-text search
 * once the database is connected.
 */
function getMockSearchResults(): SearchResult[] {
    return [
        // ── Products ──────────────────────────────────────────────────────
        {
            id: 'f-1', type: 'product', title: 'Empress Diwani Abaya Cape',
            subtitle: 'Traditional Fusion — Italian Velvet & Raw Egyptian Silk',
            image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=82',
            price: 1850, href: '/store', category: 'Traditional Fusion',
        },
        {
            id: 'f-2', type: 'product', title: 'Sadaf Inlaid Peak Tuxedo',
            subtitle: 'Men — Super-140s Wool & Silk-Satin facing',
            image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=800&q=82',
            price: 2400, href: '/store', category: 'Men',
        },
        {
            id: 'f-3', type: 'product', title: 'Fatimid Star Silk Slip Dress',
            subtitle: 'Women — 100% Mulberry Silk',
            image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=82',
            price: 980, href: '/store', category: 'Women',
        },
        {
            id: 'f-4', type: 'product', title: 'Gilded Caliph Streetwear Hoodie',
            subtitle: 'Limited Edition — 500gsm heavy loopback cotton',
            image: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=800&q=82',
            price: 450, href: '/store', category: 'Limited Edition',
        },
        {
            id: 'f-5', type: 'product', title: 'Royal Heir Linen Set',
            subtitle: 'Kids — 100% Organic Egyptian Linen',
            image: 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=800&q=82',
            price: 320, href: '/store', category: 'Kids',
        },
        // ── Artworks ──────────────────────────────────────────────────────
        {
            id: 'art-1', type: 'artwork', title: 'The Golden Diwani Diptych',
            subtitle: 'Calligraphy — 24k Gold Leaf & Calligraphy Ink',
            image: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=800&q=82',
            price: 3400, href: '/artworks', category: 'Calligraphy',
        },
        {
            id: 'art-2', type: 'artwork', title: 'Fatimid Octagram Inlay Platter',
            subtitle: 'Handmade — Copper, Mother-of-Pearl & Fine Silver',
            image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=82',
            price: 1850, href: '/artworks', category: 'Handmade',
        },
        {
            id: 'art-3', type: 'artwork', title: 'Nile Reflections in Royal Orchid',
            subtitle: 'Oil Paintings — Impasto Oil on Linen',
            image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=82',
            price: 6800, href: '/artworks', category: 'Oil Paintings',
        },
        {
            id: 'art-4', type: 'artwork', title: 'Fluid Arabesque Flow',
            subtitle: 'Digital Art — High-Fidelity Archival Giclée Print',
            image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=82',
            price: 950, href: '/artworks', category: 'Digital Art',
        },
        {
            id: 'art-5', type: 'artwork', title: 'Gilded Abaya Drapery Study',
            subtitle: 'Fashion Sketches — Gold Gouache & Charcoal',
            image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=82',
            price: 720, href: '/artworks', category: 'Fashion Sketches',
        },
        // ── Collections ────────────────────────────────────────────────────
        {
            id: 'c1', type: 'collection', title: 'Al-Muizz Couture',
            subtitle: '2026 — Cairo\'s golden history, woven into contemporary silhouettes',
            image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=85',
            price: 0, href: '/fashion', category: 'Collections',
        },
        {
            id: 'c2', type: 'collection', title: 'Sadaf Mother of Pearl',
            subtitle: '2026 — Iridescent coastal crafts meet structured tailored outerwear',
            image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1200&q=85',
            price: 0, href: '/fashion', category: 'Collections',
        },
        {
            id: 'c3', type: 'collection', title: 'The Diwani Script',
            subtitle: '2026 — Rhythmic strokes of calligraphy as wearable masterwork',
            image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1200&q=85',
            price: 0, href: '/fashion', category: 'Collections',
        },
    ];
}

export default async function SearchPage() {
    const allResults = getMockSearchResults();
    return <SearchPageClient allResults={allResults} />;
}
