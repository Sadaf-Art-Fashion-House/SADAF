/**
 * SADAF | Connections — Designer ↔ Company Partnership Types
 *
 * A connection is a collaboration request a company sends to a designer.
 * The lifecycle is:
 *   pending → accepted (active partnership)
 *          ↘ declined
 *
 * Both roles share the same underlying data — a company sees the requests it
 * sent, a designer sees the requests it received. The API returns the full
 * directory + connection list and the client filters by its own role/id.
 */

/** Where a designer-company partnership request sits. */
export type ConnectionStatus = 'pending' | 'accepted' | 'declined';

/** A company profile shown in the directory (designer side). */
export interface CompanyDirectoryEntry {
    id: string;
    name: string;
    city: string;
    focus: string;
    website?: string;
}

/** A designer profile shown in the directory (company side). */
export interface DesignerDirectoryEntry {
    id: string;
    name: string;
    city: string;
    specialty: string;
    portfolioCount: number;
    approvedCount: number;
    rating: number;
    topPiece?: string;
}

/** A single partnership request between a company and a designer. */
export interface ConnectionRequest {
    id: string;
    companyId: string;
    companyName: string;
    companyCity: string;
    companyFocus: string;
    message: string;
    designerId: string;
    designerName: string;
    designerCity: string;
    designerSpecialty: string;
    status: ConnectionStatus;
    /** ISO timestamp of when the request was sent. */
    createdAt: string;
    /** ISO timestamp of when the designer accepted/declined it. */
    respondedAt?: string;
}

/** Full payload returned by /api/dashboard/connections. */
export interface ConnectionsData {
    connections: ConnectionRequest[];
    designers: DesignerDirectoryEntry[];
    companies: CompanyDirectoryEntry[];
}

/** Payload a company sends to open a new connection request. */
export interface NewConnectionRequest {
    companyId: string;
    companyName: string;
    companyCity: string;
    companyFocus: string;
    designerId: string;
    message: string;
}

/** How a designer resolves an incoming request. */
export type ConnectionResponse = 'accept' | 'decline';
