/**
 * SADAF | Analytics Feature — Type Definitions
 */

/** A single data point for time-series charts. */
export interface ChartDataPoint {
    /** Label for the X axis (e.g. 'Mon', 'Jan', 'Q1 2026'). */
    label: string;
    /** Primary value (e.g. revenue in $). */
    value: number;
    /** Optional secondary value for comparison (previous period). */
    previousValue?: number;
}

/** Sales breakdown by product category. */
export interface CategorySales {
    category: string;
    revenue: number;
    /** Percentage of total revenue. */
    share: number;
    /** Color hex for the chart segment. */
    color: string;
    /** Number of units sold. */
    unitsSold: number;
}

/** A top-selling product entry. */
export interface TopProduct {
    id: string;
    name: string;
    /** Product category. */
    category: string;
    /** Total revenue generated. */
    revenue: number;
    /** Units sold. */
    unitsSold: number;
    /** Growth vs previous period (%). */
    growth: number;
    /** Image URL for thumbnail. */
    image: string;
}

/** User growth metrics. */
export interface UserGrowthDataPoint {
    month: string;
    /** Total registered users at this point. */
    total: number;
    /** New users joined this month. */
    newUsers: number;
    /** Active users this month. */
    activeUsers: number;
}

/** Aggregate KPI. */
export interface KpiMetric {
    label: string;
    value: string;
    /** Change indicator vs previous period. */
    change: string;
    /** Whether the change is positive. */
    isPositive: boolean;
    /** Icon name for rendering. */
    icon: string;
}

/** Complete analytics dataset. */
export interface AnalyticsData {
    /** KPI summary cards (4-6 metrics). */
    kpis: KpiMetric[];
    /** Weekly revenue data (7 days). */
    weeklyRevenue: ChartDataPoint[];
    /** Monthly revenue data (12 months). */
    monthlyRevenue: ChartDataPoint[];
    /** Sales breakdown by category. */
    categorySales: CategorySales[];
    /** Top selling products. */
    topProducts: TopProduct[];
    /** User growth over months. */
    userGrowth: UserGrowthDataPoint[];
    /** Customer acquisition channels. */
    acquisitionChannels: ChartDataPoint[];
    /** Revenue from different channels. */
    revenueByChannel: ChartDataPoint[];
}

/** Time range filter for charts. */
export type TimeRange = '7d' | '30d' | '90d' | '12m';
