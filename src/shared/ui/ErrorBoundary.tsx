'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorFallback } from '@/shared/ui/ErrorFallback';
import { logError } from '@/features/error-logging';

interface ErrorBoundaryProps {
    /** The subtree this boundary protects. */
    children: ReactNode;
    /** Identifier used in error logs to know which section crashed. */
    label?: string;
}

interface ErrorBoundaryState {
    error: Error | null;
}

/**
 * ErrorBoundary — a reusable React error boundary.
 *
 * Catches render/effect errors anywhere in its subtree, logs them through the
 * existing error-logging system (server API + localStorage fallback) so they
 * appear in the Admin/Founder Error Logs dashboards, and shows the shared
 * branded `ErrorFallback` with a "Try Again" action instead of crashing the
 * whole page.
 *
 * Unlike `src/app/error.tsx` (which Next.js uses per route segment), this
 * boundary can be placed around any subtree — a feature, a dashboard, or the
 * entire root layout — to isolate failures.
 *
 * Note: like all React error boundaries, it does not catch errors thrown in
 * event handlers, async callbacks, or inside the boundary itself.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = {
        error: null,
    };

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return { error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // Keep the console loud for local debugging.
        console.error(`[ErrorBoundary${this.props.label ? `:${this.props.label}` : ''}]`, error, errorInfo);

        // Report through the shared logging system (never blocks the fallback).
        // The component stack is folded into the report so the Error Logs
        // dashboard shows exactly which subtree failed.
        const componentStack = errorInfo.componentStack ?? '';
        const taggedError = Object.assign(new Error(error.message || 'Unknown error'), {
            stack: [error.stack, componentStack].filter(Boolean).join('\n\n'),
            digest: this.props.label ? `boundary:${this.props.label}` : undefined,
        });
        logError(taggedError).catch(() => {
            // Logging must never crash the boundary itself.
        });
    }

    private handleReset = (): void => {
        this.setState({ error: null });
    };

    render(): ReactNode {
        const { children, label } = this.props;
        const { error } = this.state;

        if (!error) return children;

        return (
            <ErrorFallback
                error={error}
                onReset={this.handleReset}
                label={label}
                size="section"
            />
        );
    }
}

export default ErrorBoundary;
