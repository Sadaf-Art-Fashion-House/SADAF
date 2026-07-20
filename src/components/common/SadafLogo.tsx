import React from 'react';

interface SadafLogoProps {
    size?: number;
    showText?: boolean;
    withMarbleBackground?: boolean;
}

export default function SadafLogo({ size = 38, showText = true, withMarbleBackground = false }: SadafLogoProps) {
    return (
        <div className="flex items-center gap-3">
            <div
                className={`flex items-center justify-center rounded-full border border-[#C9A84C]/30 ${withMarbleBackground ? 'bg-[#C9A84C]/10' : ''}`}
                style={{ width: size, height: size }}
            >
                <span className="text-[#C9A84C] font-serif text-xl">S</span>
            </div>
            {showText ? <span className="text-sm uppercase tracking-[0.3em] text-[#E8E0D5]">SADAF</span> : null}
        </div>
    );
}
