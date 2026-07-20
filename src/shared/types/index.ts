/**
 * SADAF | Art & Fashion House — Shared Type Definitions
 *
 * This is the CANONICAL type source for all features.
 * Feature-specific types (used only within one feature) belong in
 * src/features/[name]/types/index.ts — not here.
 * Before creating a new type, check this file first. If a type exists
 * but is missing fields, EXTEND it here rather than duplicating it.
 */

// ─── Auth / Users ─────────────────────────────────────────────────────────────

/**
 * The hierarchical role system for SADAF.
 *
 * customer_*  → Three customer sub-types (individual, family, friend).
 *                All customers can have connections (family members + friends
 *                they brought to the brand).
 * designer      → Independent role. A customer may ALSO have designer access
 *                 (see hasDesignerAccess on UserProfile).
 * company       → Brand / business that designs collections via AI Studio.
 * sales_partner → Standalone sales-cooperation role (not a customer type).
 * admin_*      → Admin with a specialisation (sales, media, software, super).
 * founder      → Platform owner.
 */
export type UserRole =
    | 'customer_individual'
    | 'customer_family'
    | 'customer_friend'
    | 'designer'
    | 'company'
    | 'sales_partner'
    | 'admin_sales'
    | 'admin_media'
    | 'admin_sales_media'
    | 'admin_software'
    | 'admin_super'
    | 'founder';

/**
 * Helper to check whether a role belongs to the customer family of roles.
 */
export function isCustomerRole(role: UserRole): boolean {
    return role.startsWith('customer_');
}

/**
 * Helper to check whether a role is an admin variant.
 */
export function isAdminRole(role: UserRole): boolean {
    return role.startsWith('admin_');
}

/**
 * The "base" level of a role for UI grouping.
 */
export type RoleCategory = 'customer' | 'designer' | 'company' | 'sales_partner' | 'admin' | 'founder';

export function getRoleCategory(role: UserRole): RoleCategory {
    if (role.startsWith('customer_')) return 'customer';
    if (role.startsWith('admin_')) return 'admin';
    if (role === 'designer') return 'designer';
    if (role === 'company') return 'company';
    if (role === 'sales_partner') return 'sales_partner';
    return 'founder';
}

/** Canonical user profile — used by Auth, Header, Dashboard, and Profile features. */
export interface UserProfile {
    id: string;
    email: string;
    role: UserRole;
    fullName: string;
    createdAt: string;
    /**
     * If true, the user has designer capabilities regardless of their primary role.
     * This handles the case where a customer_individual also creates designs.
     */
    hasDesignerAccess?: boolean;
    /**
     * Unique referral code for this user (e.g. "SADAF-LAYLA-7X2").
     * Used by customer_family and customer_friend signups to validate
     * they are genuinely connected to an existing customer.
     */
    referralCode?: string;
    /**
     * The referral code of the existing customer who brought this user
     * to the platform. Populated when someone signs up as family/friend.
     */
    referredBy?: string;
    /**
     * URL or base64 data string for the user's profile picture / avatar.
     * Any user can upload one regardless of their role.
     */
    avatarUrl?: string;
    /**
     * Connections: IDs of family members and friends that this customer brought
     * to the brand.  Visible on every customer dashboard.  Populated via
     * the connections / networking feature (TODO: full UI in a later iteration).
     */
    connections?: string[];
}

// ─── Art ─────────────────────────────────────────────────────────────────────

export type ArtCategory =
    | 'Handmade'
    | 'Oil Paintings'
    | 'Calligraphy'
    | 'Digital Art'
    | 'Fashion Sketches';

export interface ArtPiece {
    id: string;
    title: string;
    category: string;
    artist: string;
    price: number;
    image: string;
    description: string;
    dimensions: string;
    year: string;
    medium: string;
}

// ─── Fashion ─────────────────────────────────────────────────────────────────

export type FashionCategory =
    | 'Women'
    | 'Men'
    | 'Kids'
    | 'Traditional Fusion'
    | 'Limited Edition';

export interface FashionProduct {
    id: string;
    name: string;
    category: FashionCategory | string;
    price: number;
    image: string;
    /** Alternate image revealed on hover. Optional — not all products have one. */
    hoverImage?: string;
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

// ─── Collections ─────────────────────────────────────────────────────────────

export interface Collection {
    id: string;
    name: string;
    /** Short marketing tagline displayed on collection cards. */
    tagline: string;
    image: string;
    year: string;
    description: string;
}

// ─── AI Studio ───────────────────────────────────────────────────────────────

export interface AIClothingDesign {
    prompt: string;
    clothingType: 'Hoodie' | 'T-Shirt' | 'Abaya' | 'Jacket' | 'Streetwear';
    primaryColor: string;
    /** Dynamic SVG path/pattern details generated by the AI pipeline. */
    svgPattern: string;
    accentColor: string;
    patternName: string;
    description: string;
    /** Gemini-generated narrative for the design. */
    story: string;
    fabrics: string[];
    printingOption: 'DTG' | 'Embroidery' | 'Screen Print' | 'Puff Print';
}

// ─── AI Studio (Sizing) ─────────────────────────────────────────────────────

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

// ─── Cart ────────────────────────────────────────────────────────────────────

/**
 * A single line item in the shared cart (src/features/cart/store/useCartStore.ts).
 *
 * Exactly one of `product`, `artPiece`, or `aiCustomDesign` is populated,
 * depending on which catalog the item came from (Fashion/Marketplace,
 * Artworks, or AI Studio respectively). All three item types share the same
 * cart, checkout flow, and order total — they are never split into separate
 * carts. `itemType` is a discriminant so consumers can render/branch on the
 * line item kind without checking which optional field is set.
 */
export interface CartItem {
    /** Unique cart-line instance id (not the product/art/design id). */
    id: string;
    itemType: 'product' | 'art' | 'aiCustomDesign';
    product?: FashionProduct;
    artPiece?: ArtPiece;
    aiCustomDesign?: AIClothingDesign;
    quantity: number;
    selectedSize: string;
    selectedColor?: string;
    selectedFabric?: string;
    selectedPrinting?: string;
    /** Price for this line (unit price × quantity), kept denormalized so
     *  cart totals stay stable even if the underlying catalog price changes. */
    totalPrice: number;
}