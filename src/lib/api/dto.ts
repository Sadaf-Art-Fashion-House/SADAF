/** Odoo `/api/v1` response shapes used by the storefront adapters. */

export interface OdooProductDto {
    id: number;
    name: string;
    nameAr?: string | null;
    category?: string | null;
    price?: number | null;
    image?: string | null;
    hoverImage?: string | null;
    description?: string | null;
    descriptionAr?: string | null;
    artist?: string | null;
    dimensions?: string | null;
    year?: string | null;
    medium?: string | null;
    fabric?: string | null;
    fabricAr?: string | null;
    sizes?: unknown;
    colors?: unknown;
    details?: unknown;
    detailsAr?: unknown;
    rating?: number | null;
    isArt?: boolean | null;
    slug?: string | null;
    collections?: Array<{ id: number; name: string }>;
}

export interface OdooProductListDto {
    items: OdooProductDto[];
    total: number;
    limit: number;
    offset: number;
}

export interface OdooCollectionDto {
    id: number;
    name: string;
    nameAr?: string | null;
    tagline?: string | null;
    taglineAr?: string | null;
    image?: string | null;
    year?: string | null;
    description?: string | null;
    descriptionAr?: string | null;
    productIds?: number[];
}

export interface OdooLookbookDto {
    id: number;
    title: string;
    titleAr?: string | null;
    subtitle?: string | null;
    subtitleAr?: string | null;
    image?: string | null;
    year?: string | null;
    description?: string | null;
    descriptionAr?: string | null;
    productId?: number | null;
}

export interface OdooListDto<T> {
    items: T[];
}

export interface OdooSearchDto {
    query: string;
    products: OdooProductDto[];
    collections: OdooCollectionDto[];
    lookbook: OdooLookbookDto[];
}
