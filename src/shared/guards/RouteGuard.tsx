import React from 'react';

interface RouteGuardProps {
    children: React.ReactNode;
    isAllowed?: boolean;
}

export function RouteGuard({ children, isAllowed = true }: RouteGuardProps) {
    if (!isAllowed) {
        return null;
    }

    return <>{children}</>;
}
