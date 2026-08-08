/**
 * SADAF | API — Connections Store (in-memory)
 *
 * Mutable source of truth for the Designer ↔ Company partnership hub. The
 * GET route reads it; the POST route (company sends a request) and the PATCH
 * route (designer accepts/declines) mutate it, so every change appears
 * immediately and the 10s WS push (connections:global) keeps both connected
 * roles in sync.
 *
 * Seeded with a designer/company directory and requests in every status so
 * both sides of the hub are meaningful during development. Swap for a
 * Prisma/database table in production (state resets on server restart, like
 * the other demo stores).
 */

import type {
    ConnectionRequest,
    CompanyDirectoryEntry,
    DesignerDirectoryEntry,
    NewConnectionRequest,
    ConnectionResponse,
} from '@/features/connections/types';

const DAY_MS = 86_400_000;

/** Companies that can open partnership requests with designers. */
const SEEDED_COMPANIES: CompanyDirectoryEntry[] = [
    {
        id: 'usr-5',
        name: 'Nile Designs Co.',
        city: 'Cairo',
        focus: 'Bridal & Occasion Wear',
        website: 'niledesigns.example',
    },
    {
        id: 'cmp-2',
        name: 'Maison Levant',
        city: 'Beirut',
        focus: 'Luxury Ready-to-Wear',
        website: 'maisonlevant.example',
    },
    {
        id: 'cmp-3',
        name: 'Atlas Textiles GmbH',
        city: 'Berlin',
        focus: 'Premium Fabrics & Atelier',
    },
];

/** Designers a company can discover and connect with. */
const SEEDED_DESIGNERS: DesignerDirectoryEntry[] = [
    {
        id: 'usr-4',
        name: 'Karim El-Sayed',
        city: 'Cairo',
        specialty: 'Abaya & Modest Couture',
        portfolioCount: 6,
        approvedCount: 2,
        rating: 4.9,
        topPiece: 'Empress Diwani Abaya Cape',
    },
    {
        id: 'dst-2',
        name: 'Lina Al-Rashid',
        city: 'Riyadh',
        specialty: 'Kaftan & Evening Wear',
        portfolioCount: 12,
        approvedCount: 5,
        rating: 4.8,
        topPiece: 'Dune Rose Kaftan',
    },
    {
        id: 'dst-3',
        name: 'Omar Ben Ali',
        city: 'Marrakech',
        specialty: 'Editorial & Streetwear',
        portfolioCount: 9,
        approvedCount: 4,
        rating: 4.7,
        topPiece: 'Zellige Overshirt',
    },
    {
        id: 'dst-4',
        name: 'Yara Haddad',
        city: 'Dubai',
        specialty: 'Bridal & Occasion',
        portfolioCount: 8,
        approvedCount: 3,
        rating: 4.8,
        topPiece: 'Pearl Mina Gown',
    },
];

/** Partnership requests — seeded so both roles have pending + active data. */
const SEEDED_CONNECTIONS: ConnectionRequest[] = [
    {
        id: 'cn-1',
        companyId: 'usr-5',
        companyName: 'Nile Designs Co.',
        companyCity: 'Cairo',
        companyFocus: 'Bridal & Occasion Wear',
        message: 'We admire your Diwani embroidery work — let’s collaborate on our winter bridal capsule.',
        designerId: 'usr-4',
        designerName: 'Karim El-Sayed',
        designerCity: 'Cairo',
        designerSpecialty: 'Abaya & Modest Couture',
        status: 'pending',
        createdAt: new Date(Date.now() - 1 * DAY_MS).toISOString(),
    },
    {
        id: 'cn-2',
        companyId: 'usr-5',
        companyName: 'Nile Designs Co.',
        companyCity: 'Cairo',
        companyFocus: 'Bridal & Occasion Wear',
        message: 'Your kaftan silhouettes would elevate our Riyadh pop-up — partnership offer extended.',
        designerId: 'dst-2',
        designerName: 'Lina Al-Rashid',
        designerCity: 'Riyadh',
        designerSpecialty: 'Kaftan & Evening Wear',
        status: 'accepted',
        createdAt: new Date(Date.now() - 9 * DAY_MS).toISOString(),
        respondedAt: new Date(Date.now() - 7 * DAY_MS).toISOString(),
    },
    {
        id: 'cn-3',
        companyId: 'cmp-2',
        companyName: 'Maison Levant',
        companyCity: 'Beirut',
        companyFocus: 'Luxury Ready-to-Wear',
        message: 'We would like to commission three editorial pieces for our spring campaign.',
        designerId: 'usr-4',
        designerName: 'Karim El-Sayed',
        designerCity: 'Cairo',
        designerSpecialty: 'Abaya & Modest Couture',
        status: 'accepted',
        createdAt: new Date(Date.now() - 14 * DAY_MS).toISOString(),
        respondedAt: new Date(Date.now() - 12 * DAY_MS).toISOString(),
    },
    {
        id: 'cn-4',
        companyId: 'cmp-3',
        companyName: 'Atlas Textiles GmbH',
        companyCity: 'Berlin',
        companyFocus: 'Premium Fabrics & Atelier',
        message: 'Interested in a fabric-collaboration line — sample brief attached.',
        designerId: 'dst-3',
        designerName: 'Omar Ben Ali',
        designerCity: 'Marrakech',
        designerSpecialty: 'Editorial & Streetwear',
        status: 'declined',
        createdAt: new Date(Date.now() - 5 * DAY_MS).toISOString(),
        respondedAt: new Date(Date.now() - 4 * DAY_MS).toISOString(),
    },
];

let connections: ConnectionRequest[] = SEEDED_CONNECTIONS;

/** Snapshot of the full connections payload (directory + requests). */
export function getConnectionsData(): {
    connections: ConnectionRequest[];
    designers: DesignerDirectoryEntry[];
    companies: CompanyDirectoryEntry[];
} {
    return { connections, designers: SEEDED_DESIGNERS, companies: SEEDED_COMPANIES };
}

/**
 * Open a new partnership request (company → designer). Duplicate pending
 * requests from the same company to the same designer are rejected so the
 * list cannot flood with retries.
 */
export function addConnectionRequest(input: NewConnectionRequest): ConnectionRequest | null {
    const duplicate = connections.some(
        (c) =>
            c.companyId === input.companyId &&
            c.designerId === input.designerId &&
            c.status === 'pending',
    );
    if (duplicate) return null;

    const designer = SEEDED_DESIGNERS.find((d) => d.id === input.designerId);
    if (!designer) return null;

    const request: ConnectionRequest = {
        id: `cn-${Date.now()}`,
        companyId: input.companyId,
        companyName: input.companyName.trim(),
        companyCity: input.companyCity.trim(),
        companyFocus: input.companyFocus.trim(),
        message: input.message.trim(),
        designerId: designer.id,
        designerName: designer.name,
        designerCity: designer.city,
        designerSpecialty: designer.specialty,
        status: 'pending',
        createdAt: new Date().toISOString(),
    };
    connections = [request, ...connections];
    return request;
}

/**
 * Resolve an incoming request (designer side). Returns the updated request,
 * or null when the id is unknown or the request was already resolved.
 */
export function respondToConnectionRequest(
    id: string,
    response: ConnectionResponse,
): ConnectionRequest | null {
    const request = connections.find((c) => c.id === id);
    if (!request || request.status !== 'pending') return null;

    request.status = response === 'accept' ? 'accepted' : 'declined';
    request.respondedAt = new Date().toISOString();
    return request;
}
