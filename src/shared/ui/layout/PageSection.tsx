import React from 'react';

interface PageSectionProps {
    children: React.ReactNode;
    className?: string;
}

export function PageSection({ children, className = '' }: PageSectionProps) {
    return <section className={`px-4 md:px-8 ${className}`.trim()}>{children}</section>;
}
