import type { ArtPiece, Collection, FashionProduct, LookbookItem } from '@/shared/types';
import type { SearchResult } from '@/features/search/types';
import {
    toArtPiece,
    toCollection,
    toFashionProduct,
    toLookbookItem,
} from './adapters/catalog';
import type {
    OdooCollectionDto,
    OdooListDto,
    OdooLookbookDto,
    OdooProductDto,
    OdooProductListDto,
} from './dto';
import { SadafApiError } from './errors';
import { sadafFetch } from './http';

const PAGE_SIZE = 100;

type ProductKind = 'fashion' | 'art' | 'all';

async function getProductPage(
    kind: ProductKind,
    offset: number,
): Promise<OdooProductListDto> {
    const params = new URLSearchParams({
        type: kind,
        limit: String(PAGE_SIZE),
        offset: String(offset),
    });

    return sadafFetch<OdooProductListDto>(
        `/api/v1/catalog/products?${params.toString()}`,
    );
}

/**
 * Fetch every product of a kind. The catalog endpoint is paginated (max 100
 * per response), so this follows `total` instead of assuming the first page
 * contains the whole catalog.
 */
async function getAllProductDtos(kind: ProductKind): Promise<OdooProductDto[]> {
    const items: OdooProductDto[] = [];
    let offset = 0;

    while (true) {
        const page = await getProductPage(kind, offset);
        items.push(...page.items);

        if (page.items.length === 0 || items.length >= page.total) {
            break;
        }

        offset += page.items.length;
    }

    // Keep the original catalog order (migration ids follow the editorial
    // order) instead of relying on the API's newest-first default.
    return items.sort((left, right) => left.id - right.id);
}

export async function getFashionProducts(): Promise<FashionProduct[]> {
    const products = await getAllProductDtos('fashion');
    return products
        .filter((product) => !product.isArt)
        .map(toFashionProduct);
}

export async function getArtworks(): Promise<ArtPiece[]> {
    const products = await getAllProductDtos('art');
    return products
        .filter((product) => product.isArt)
        .map(toArtPiece);
}

export async function getCollections(): Promise<Collection[]> {
    const response = await sadafFetch<OdooListDto<OdooCollectionDto>>(
        '/api/v1/catalog/collections',
    );
    return response.items.map(toCollection);
}

export async function getLookbook(): Promise<LookbookItem[]> {
    const response = await sadafFetch<OdooListDto<OdooLookbookDto>>(
        '/api/v1/catalog/lookbook',
    );
    return response.items.map(toLookbookItem);
}

/**
 * Resolve one product by its numeric Odoo id. Returns null for malformed ids
 * and for Odoo's 404 so the page can render the normal not-found view.
 */
export async function getFashionProduct(id: string): Promise<FashionProduct | null> {
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) return null;

    try {
        const dto = await sadafFetch<OdooProductDto>(
            `/api/v1/catalog/products/${numericId}`,
        );
        if (dto.isArt) return null;
        return toFashionProduct(dto);
    } catch (error) {
        if (error instanceof SadafApiError && error.status === 404) return null;
        throw error;
    }
}

/**
 * Resolve a product from either its numeric Odoo id or its stable migration
 * slug (e.g. `f-1`). Keeping slug support means existing bookmarked product
 * URLs keep working after the catalog moved to numeric Odoo ids.
 */
export async function getFashionProductByIdOrSlug(
    idOrSlug: string,
): Promise<FashionProduct | null> {
    const numericId = Number(idOrSlug);
    if (Number.isInteger(numericId) && numericId > 0) {
        return getFashionProduct(idOrSlug);
    }

    const slug = idOrSlug.trim();
    if (!slug) return null;

    const products = await getAllProductDtos('fashion');
    const dto = products.find((product) => product.slug === slug && !product.isArt);
    return dto ? toFashionProduct(dto) : null;
}

export async function getCatalogSearchResults(): Promise<SearchResult[]> {
    const [fashion, artworks, collections] = await Promise.all([
        getFashionProducts(),
        getArtworks(),
        getCollections(),
    ]);

    const productResults: SearchResult[] = fashion.map((product) => ({
        // Product ids intentionally stay raw (numeric strings) because the
        // search view joins these against review ratings by product id.
        id: product.id,
        type: 'product',
        title: product.name,
        subtitle: [product.category, product.fabric].filter(Boolean).join(' — '),
        image: product.image,
        price: product.price,
        href: `/store/${product.id}`,
        category: product.category,
    }));

    const artworkResults: SearchResult[] = artworks.map((artwork) => ({
        id: `artwork-${artwork.id}`,
        type: 'artwork',
        title: artwork.title,
        subtitle: [artwork.category, artwork.medium].filter(Boolean).join(' — '),
        image: artwork.image,
        price: artwork.price,
        href: '/artworks',
        category: artwork.category,
    }));

    const collectionResults: SearchResult[] = collections.map((collection) => ({
        id: `collection-${collection.id}`,
        type: 'collection',
        title: collection.name,
        subtitle: [collection.year, collection.tagline].filter(Boolean).join(' — '),
        image: collection.image,
        price: 0,
        href: '/fashion',
        category: 'Collections',
    }));

    return [...productResults, ...artworkResults, ...collectionResults];
}
