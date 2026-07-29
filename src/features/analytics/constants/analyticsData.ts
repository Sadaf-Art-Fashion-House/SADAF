/**
 * SADAF | Analytics Feature — Mock Data
 *
 * Simulated KPI, revenue, category, product, and user growth data
 * derived from the fashionDatabase and artDatabase catalogs.
 */

import type {
    AnalyticsData,
    ChartDataPoint,
    CategorySales,
    TopProduct,
    UserGrowthDataPoint,
    KpiMetric,
} from '../types';

// ─── KPI Metrics ───────────────────────────────────────────────────────────

export const MOCK_KPIS: KpiMetric[] = [
    { label: 'Total Revenue', value: '$148,500', change: '+18.2%', isPositive: true, icon: 'TrendingUp' },
    { label: 'Orders', value: '342', change: '+12.5%', isPositive: true, icon: 'ShoppingBag' },
    { label: 'Active Customers', value: '1,247', change: '+9.4%', isPositive: true, icon: 'Users' },
    { label: 'Avg Order Value', value: '$434', change: '+5.8%', isPositive: true, icon: 'DollarSign' },
    { label: 'Conversion Rate', value: '3.2%', change: '-0.4%', isPositive: false, icon: 'TrendingDown' },
    { label: 'AI Designs Created', value: '1,294', change: '+24.8%', isPositive: true, icon: 'Cpu' },
];

// ─── Weekly Revenue (last 7 days) ──────────────────────────────────────────

export const MOCK_WEEKLY_REVENUE: ChartDataPoint[] = [
    { label: 'Mon', value: 12500, previousValue: 11200 },
    { label: 'Tue', value: 18200, previousValue: 15400 },
    { label: 'Wed', value: 22100, previousValue: 19800 },
    { label: 'Thu', value: 15300, previousValue: 16500 },
    { label: 'Fri', value: 26100, previousValue: 22100 },
    { label: 'Sat', value: 34700, previousValue: 28500 },
    { label: 'Sun', value: 19600, previousValue: 17800 },
];

// ─── Monthly Revenue (12 months) ───────────────────────────────────────────

export const MOCK_MONTHLY_REVENUE: ChartDataPoint[] = [
    { label: 'Aug', value: 82000, previousValue: 74000 },
    { label: 'Sep', value: 95600, previousValue: 88100 },
    { label: 'Oct', value: 112300, previousValue: 99500 },
    { label: 'Nov', value: 134800, previousValue: 118200 },
    { label: 'Dec', value: 189400, previousValue: 152100 },
    { label: 'Jan', value: 145200, previousValue: 134600 },
    { label: 'Feb', value: 128900, previousValue: 121400 },
    { label: 'Mar', value: 156700, previousValue: 142300 },
    { label: 'Apr', value: 142100, previousValue: 138900 },
    { label: 'May', value: 167300, previousValue: 151200 },
    { label: 'Jun', value: 183600, previousValue: 164500 },
    { label: 'Jul', value: 148500, previousValue: 139800 },
];

// ─── Category Sales ────────────────────────────────────────────────────────

export const MOCK_CATEGORY_SALES: CategorySales[] = [
    { category: 'Traditional Fusion', revenue: 52300, share: 35.2, color: '#C9A84C', unitsSold: 89 },
    { category: 'Women', revenue: 31200, share: 21.0, color: '#4FC3F7', unitsSold: 124 },
    { category: 'Men', revenue: 24500, share: 16.5, color: '#10B981', unitsSold: 67 },
    { category: 'Limited Edition', revenue: 18900, share: 12.7, color: '#F59E0B', unitsSold: 34 },
    { category: 'Kids', revenue: 8700, share: 5.9, color: '#EC4899', unitsSold: 52 },
    { category: 'Art Pieces', revenue: 12900, share: 8.7, color: '#8B5CF6', unitsSold: 18 },
];

// ─── Top Products ──────────────────────────────────────────────────────────

export const MOCK_TOP_PRODUCTS: TopProduct[] = [
    {
        id: 'f-1', name: 'Empress Diwani Abaya Cape', category: 'Traditional Fusion',
        revenue: 31450, unitsSold: 17, growth: 12.4,
        image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=100&q=80',
    },
    {
        id: 'f-2', name: 'Sadaf Inlaid Peak Tuxedo', category: 'Men',
        revenue: 26400, unitsSold: 11, growth: 8.2,
        image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=100&q=80',
    },
    {
        id: 'f-3', name: 'Fatimid Star Silk Slip Dress', category: 'Women',
        revenue: 18620, unitsSold: 19, growth: 21.7,
        image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=100&q=80',
    },
    {
        id: 'f-4', name: 'Gilded Caliph Streetwear Hoodie', category: 'Limited Edition',
        revenue: 14400, unitsSold: 32, growth: 45.3,
        image: 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=100&q=80',
    },
    {
        id: 'art-1', name: 'The Golden Diwani Diptych', category: 'Art Pieces',
        revenue: 10200, unitsSold: 3, growth: -5.1,
        image: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&w=100&q=80',
    },
];

// ─── User Growth (12 months) ───────────────────────────────────────────────

export const MOCK_USER_GROWTH: UserGrowthDataPoint[] = [
    { month: 'Aug', total: 420, newUsers: 45, activeUsers: 280 },
    { month: 'Sep', total: 478, newUsers: 58, activeUsers: 312 },
    { month: 'Oct', total: 552, newUsers: 74, activeUsers: 365 },
    { month: 'Nov', total: 641, newUsers: 89, activeUsers: 421 },
    { month: 'Dec', total: 758, newUsers: 117, activeUsers: 498 },
    { month: 'Jan', total: 834, newUsers: 76, activeUsers: 542 },
    { month: 'Feb', total: 891, newUsers: 57, activeUsers: 561 },
    { month: 'Mar', total: 978, newUsers: 87, activeUsers: 623 },
    { month: 'Apr', total: 1042, newUsers: 64, activeUsers: 658 },
    { month: 'May', total: 1134, newUsers: 92, activeUsers: 712 },
    { month: 'Jun', total: 1247, newUsers: 113, activeUsers: 784 },
    { month: 'Jul', total: 1312, newUsers: 65, activeUsers: 801 },
];

// ─── Acquisition Channels ──────────────────────────────────────────────────

export const MOCK_ACQUISITION_CHANNELS: ChartDataPoint[] = [
    { label: 'Referral', value: 35 },
    { label: 'Social Media', value: 28 },
    { label: 'Direct', value: 18 },
    { label: 'Search', value: 12 },
    { label: 'Email', value: 7 },
];

// ─── Revenue by Channel ────────────────────────────────────────────────────

export const MOCK_REVENUE_BY_CHANNEL: ChartDataPoint[] = [
    { label: 'Online Store', value: 89200 },
    { label: 'Atelier (Boutique)', value: 41200 },
    { label: 'Exhibitions', value: 12100 },
    { label: 'Wholesale', value: 5800 },
];

// ─── Full Dataset ──────────────────────────────────────────────────────────

export const MOCK_ANALYTICS_DATA: AnalyticsData = {
    kpis: MOCK_KPIS,
    weeklyRevenue: MOCK_WEEKLY_REVENUE,
    monthlyRevenue: MOCK_MONTHLY_REVENUE,
    categorySales: MOCK_CATEGORY_SALES,
    topProducts: MOCK_TOP_PRODUCTS,
    userGrowth: MOCK_USER_GROWTH,
    acquisitionChannels: MOCK_ACQUISITION_CHANNELS,
    revenueByChannel: MOCK_REVENUE_BY_CHANNEL,
};
