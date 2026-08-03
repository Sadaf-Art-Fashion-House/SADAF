/**
 * SADAF | Customer Feature — Type Definitions
 */

/** A single order entry in the personal analysis. */
export interface CustomerOrder {
    id: string;
    date: string;
    total: number;
    status: 'Pending' | 'Tailoring' | 'Shipped' | 'Delivered';
    items: number;
}

/** Monthly spending point for the trend chart. */
export interface CustomerSpendingPoint {
    month: string;
    value: number;
}

/** Spending by product category (pie chart). */
export interface CustomerCategorySpend {
    category: string;
    value: number;
    color: string;
}

/** Personal analysis dataset returned by /api/dashboard/customer-analysis. */
export interface CustomerAnalysisData {
    /** Summary KPIs (total spent, order count, wishlist size, AI designs). */
    kpis: {
        label: string;
        value: string;
        change: string;
        isPositive: boolean;
        icon: string;
    }[];
    /** Order history for the orders table. */
    orders: CustomerOrder[];
    /** Monthly spending series (12 months). */
    monthlySpending: CustomerSpendingPoint[];
    /** Spending split by product category. */
    categorySpend: CustomerCategorySpend[];
    /** Average order value. */
    averageOrderValue: number;
    /** Membership tier label. */
    tier: string;
    /** Total wishlist value. */
    wishlistValue: number;
    timestamp: string;
}
