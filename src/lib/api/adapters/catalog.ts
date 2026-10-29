import type { ArtPiece, Collection, FashionProduct, LookbookItem } from '@/shared/types';
import type {
    OdooCollectionDto,
    OdooLookbookDto,
    OdooProductDto,
} from '../dto';

export const SADAF_PLACEHOLDER_IMAGE = '/sadaf-placeholder.svg';

function optionalString(value: unknown): string | undefined {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}

function stringValue(value: unknown, fallback = ''): string {
    return optionalString(value) ?? fallback;
}

function stringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value
        .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
        .filter((entry) => entry.length > 0);
}

/**
 * Odoo returns product images as either external URLs (Unsplash in the
 * migration snapshot) or Odoo-relative `/web/image/...` paths. Relative paths
 * must go through the same-origin media proxy so the browser never talks to
 * Odoo directly.
 */
export function resolveCatalogImage(value: unknown): string {
    const raw = optionalString(value);
    if (!raw) return SADAF_PLACEHOLDER_IMAGE;

    if (raw.startsWith('/api/media/')) return raw;

    const webImageIndex = raw.indexOf('/web/image/');
    if (webImageIndex >= 0) {
        return `/api/media${raw.slice(webImageIndex)}`;
    }

    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    if (raw.startsWith('/')) return `/api/media${raw}`;

    return raw;
}

function normalizeColors(value: unknown): FashionProduct['colors'] {
    if (!Array.isArray(value)) return [];

    return value.flatMap((entry) => {
        if (typeof entry === 'string') {
            const name = entry.trim();
            if (!name) return [];
            return [{ name, hex: '#C9A84C' }];
        }

        if (!entry || typeof entry !== 'object') return [];

        const record = entry as Record<string, unknown>;
        const name =
            optionalString(record.name) ??
            optionalString(record.label) ??
            optionalString(record.hex);
        if (!name) return [];

        const nameAr = optionalString(record.nameAr);
        return [
            {
                name,
                ...(nameAr ? { nameAr } : {}),
                hex: optionalString(record.hex) ?? '#C9A84C',
            },
        ];
    });
}

function buildLocalizedText(
    english: {
        name: string;
        description: string;
        fabric: string;
        details: string[];
    },
    arabic: {
        name?: string;
        description?: string;
        fabric?: string;
        details: string[];
    },
): FashionProduct['i18n'] {
    if (
        !arabic.name &&
        !arabic.description &&
        !arabic.fabric &&
        arabic.details.length === 0
    ) {
        return undefined;
    }

    return {
        name: arabic.name ?? english.name,
        description: arabic.description ?? english.description,
        fabric: arabic.fabric ?? english.fabric,
        details: arabic.details.length > 0 ? arabic.details : english.details,
    };
}

export function toFashionProduct(dto: OdooProductDto): FashionProduct {
    const name = stringValue(dto.name);
    const description = stringValue(dto.description);
    const fabric = stringValue(dto.fabric);
    const details = stringArray(dto.details);
    const nameAr = optionalString(dto.nameAr);
    const descriptionAr = optionalString(dto.descriptionAr);
    const fabricAr = optionalString(dto.fabricAr);
    const detailsAr = stringArray(dto.detailsAr);

    return {
        id: String(dto.id),
        name,
        ...(nameAr ? { nameAr } : {}),
        category: stringValue(dto.category, 'Uncategorized'),
        price: Number(dto.price) || 0,
        image: resolveCatalogImage(dto.image),
        ...(optionalString(dto.hoverImage)
            ? { hoverImage: resolveCatalogImage(dto.hoverImage) }
            : {}),
        description,
        ...(descriptionAr ? { descriptionAr } : {}),
        fabric,
        ...(fabricAr ? { fabricAr } : {}),
        sizes: stringArray(dto.sizes),
        colors: normalizeColors(dto.colors),
        details,
        ...(detailsAr.length > 0 ? { detailsAr } : {}),
        rating: Number(dto.rating) || 0,
        i18n: buildLocalizedText(
            { name, description, fabric, details },
            {
                name: nameAr,
                description: descriptionAr,
                fabric: fabricAr,
                details: detailsAr,
            },
        ),
    };
}

export function toArtPiece(dto: OdooProductDto): ArtPiece {
    return {
        id: String(dto.id),
        title: stringValue(dto.name),
        ...(optionalString(dto.nameAr) ? { titleAr: optionalString(dto.nameAr) } : {}),
        category: stringValue(dto.category, 'Uncategorized'),
        artist: stringValue(dto.artist),
        price: Number(dto.price) || 0,
        image: resolveCatalogImage(dto.image),
        description: stringValue(dto.description),
        ...(optionalString(dto.descriptionAr)
            ? { descriptionAr: optionalString(dto.descriptionAr) }
            : {}),
        dimensions: stringValue(dto.dimensions),
        year: stringValue(dto.year),
        medium: stringValue(dto.medium),
    };
}

export function toCollection(dto: OdooCollectionDto): Collection {
    return {
        id: String(dto.id),
        name: stringValue(dto.name),
        tagline: stringValue(dto.tagline),
        image: resolveCatalogImage(dto.image),
        year: stringValue(dto.year),
        description: stringValue(dto.description),
    };
}

export function toLookbookItem(dto: OdooLookbookDto): LookbookItem {
    return {
        id: String(dto.id),
        title: stringValue(dto.title),
        subtitle: stringValue(dto.subtitle),
        image: resolveCatalogImage(dto.image),
        year: stringValue(dto.year),
        description: stringValue(dto.description),
        ...(optionalString(dto.titleAr) ? { titleAr: optionalString(dto.titleAr) } : {}),
        ...(optionalString(dto.subtitleAr)
            ? { subtitleAr: optionalString(dto.subtitleAr) }
            : {}),
        ...(optionalString(dto.descriptionAr)
            ? { descriptionAr: optionalString(dto.descriptionAr) }
            : {}),
    };
}
