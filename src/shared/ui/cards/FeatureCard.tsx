import React from 'react';

interface FeatureCardProps {
    title: string;
    description: string;
    accent?: string;
    children?: React.ReactNode;
}

export function FeatureCard({ title, description, accent = '#C9A84C', children }: FeatureCardProps) {
    return (
        <div className="rounded-2xl border border-white/10 bg-[#0A0F2C]/80 p-6 shadow-xl" style={{ borderColor: `${accent}20` }}>
            <h3 className="font-serif text-xl text-white mb-2">{title}</h3>
            <p className="text-sm text-[#E8E0D5]/70 leading-relaxed">{description}</p>
            {children}
        </div>
    );
}
