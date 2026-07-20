import type { ReactNode } from 'react';

interface AppLayoutProps {
    children: ReactNode;
    className?: string;
}

export function AppLayout({ children, className = '' }: AppLayoutProps) {
    return (
        <div
            className={`min-h-screen bg-[#0A0F2C] text-[#E8E0D5] flex flex-col font-sans select-none overflow-x-hidden relative ${className}`.trim()}
        >
            {children}
        </div>
    );
}
