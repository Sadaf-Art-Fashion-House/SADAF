/**
 * SADAF | Community Feature — Type Definitions
 *
 * Customers can connect with family members and friends they brought
 * to the platform via referral codes. This feature provides a dedicated
 * page for viewing and managing those connections, plus a graph
 * visualization of the social network.
 */

/** Relationship type between two connected customers. */
export type ConnectionType = 'family' | 'friend';

/** Status of a connection or connection request. */
export type ConnectionStatus = 'connected' | 'pending' | 'declined';

/**
 * A single connection between two customers.
 * `userId` is the connected party; the current user is implicit.
 */
export interface Connection {
    /** The connected user's unique id. */
    userId: string;
    /** Display name of the connected user. */
    name: string;
    /** The connected user's role sub-type (individual, family, friend). */
    role: string;
    /** Avatar URL or base64 data string. */
    avatarUrl?: string;
    /** Relationship: family or friend. */
    type: ConnectionType;
    /** Status of this connection. */
    status: ConnectionStatus;
    /** ISO date string when the connection was established. */
    connectedSince: string;
    /** How this person was referred (referral code or username). */
    referredVia?: string;
    /** Number of purchases they've made (encourages engagement). */
    purchaseCount?: number;
    /** Total spent in USD (visible to the referrer). */
    totalSpent?: number;
}

/** A pending invitation sent or received. */
export interface ConnectionRequest {
    id: string;
    /** The other party's user id. */
    userId: string;
    name: string;
    avatarUrl?: string;
    email: string;
    type: ConnectionType;
    /** Direction: 'sent' means current user initiated, 'received' means someone invited them. */
    direction: 'sent' | 'received';
    /** ISO date string when the request was created. */
    createdAt: string;
    /** Optional personal message. */
    message?: string;
}

/** A node in the network graph. */
export interface NetworkNode {
    id: string;
    name: string;
    role: string;
    avatarUrl?: string;
    /** Group / cluster this node belongs to (e.g. 'family', 'friends'). */
    group: 'self' | 'family' | 'friend';
    /** Number of purchases — influences node size. */
    purchaseCount?: number;
}

/** An edge (link) in the network graph between two nodes. */
export interface NetworkLink {
    source: string;
    target: string;
    type: ConnectionType;
    /** Strength of the connection (0–1) — influences edge thickness. */
    strength: number;
}

/** The full network graph data structure. */
export interface NetworkGraph {
    nodes: NetworkNode[];
    links: NetworkLink[];
}

/** Referral information for the current user. */
export interface ReferralInfo {
    /** The current user's referral code. */
    myCode: string;
    /** Number of people who signed up using this code. */
    totalReferred: number;
    /** Total rewards / discounts earned from referrals. */
    totalRewardsEarned: number;
    /** List of people who joined via this referral code. */
    referredUsers: ReferredUser[];
}

export interface ReferredUser {
    id: string;
    name: string;
    role: string;
    avatarUrl?: string;
    joinedAt: string;
    /** Whether they have made their first purchase. */
    hasFirstPurchase: boolean;
}

/** Aggregate community state. */
export interface CommunityState {
    connections: Connection[];
    pendingRequests: ConnectionRequest[];
    sentRequests: ConnectionRequest[];
    networkGraph: NetworkGraph;
    referralInfo: ReferralInfo;
}
