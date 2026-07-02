import React from 'react';

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
}

export function PrimaryButton({ children, className = '', ...props }: PrimaryButtonProps) {
    return (
        <button
            className={`px-6 py-3 rounded-full border border-[#C9A84C] bg-gradient-to-r from-[#C9A84C] to-[#E8E0D5]/90 text-[#0A0F2C] hover:text-white font-medium text-sm tracking-[0.14em] uppercase transition-all duration-300 shadow-xl shadow-[#C9A84C]/10 active:scale-95 cursor-pointer ${className}`.trim()}
            {...props}
        >
            {children}
        </button>
    );
}
