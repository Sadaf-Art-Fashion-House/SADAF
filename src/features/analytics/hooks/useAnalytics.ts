'use client';

import { useState, useMemo, useCallback } from 'react';
import type { AnalyticsData, TimeRange, ChartDataPoint } from '../types';
import { MOCK_ANALYTICS_DATA } from '../constants/analyticsData';

/**
 * useAnalytics — processes analytics data and applies time-range filtering.
 *
 * Currently uses mock data; swap with Supabase/API queries when ready.
 *
 * @param initialData - Override data (for server-provided datasets).
 */
export function useAnalytics(initialData?: AnalyticsData) {
    const [data] = useState<AnalyticsData>(initialData ?? MOCK_ANALYTICS_DATA);
    const [timeRange, setTimeRange] = useState<TimeRange>('7d');

    // ── Time-range filtered data ────────────────────────────────────────

    const filteredRevenue = useMemo((): ChartDataPoint[] => {
        switch (timeRange) {
            case '7d':
                return data.weeklyRevenue;
            case '30d':
                // Simulate 4 weeks by repeating weekly data with variation
                return [...data.weeklyRevenue, ...data.weeklyRevenue.map((d) => ({
                    ...d,
                    value: Math.round(d.value * 0.9),
                    previousValue: d.previousValue ? Math.round(d.previousValue * 0.85) : undefined,
                }))];
            case '90d':
            case '12m':
                return data.monthlyRevenue;
            default:
                return data.weeklyRevenue;
        }
    }, [data, timeRange]);

    // ── Formatted values ────────────────────────────────────────────────

    const formatCurrency = useCallback((value: number): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    }, []);

    const formatPercent = useCallback((value: number): string => {
        return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
    }, []);

    // ── Derived metrics ─────────────────────────────────────────────────

    const totalRevenue = useMemo(
        () => data.monthlyRevenue.reduce((sum, d) => sum + d.value, 0),
        [data.monthlyRevenue],
    );

    const averageOrderValue = useMemo(() => {
        const totalOrders = data.kpis.find((k) => k.label === 'Orders')?.value ?? '342';
        const orderCount = parseInt(totalOrders.replace(/,/g, ''), 10);
        return orderCount > 0 ? Math.round(totalRevenue / orderCount) : 0;
    }, [totalRevenue, data.kpis]);

    const growthRate = useMemo(() => {
        if (data.monthlyRevenue.length < 2) return 0;
        const last = data.monthlyRevenue[data.monthlyRevenue.length - 1].value;
        const prev = data.monthlyRevenue[data.monthlyRevenue.length - 2].value;
        return prev > 0 ? ((last - prev) / prev) * 100 : 0;
    }, [data.monthlyRevenue]);

    return {
        data,
        timeRange,
        setTimeRange,
        filteredRevenue,
        formatCurrency,
        formatPercent,
        totalRevenue,
        averageOrderValue,
        growthRate,
    };
}
