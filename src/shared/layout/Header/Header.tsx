"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, ShoppingCart, User } from "lucide-react";
import SadafLogo from "@/components/common/SadafLogo";
import { useCartStore } from "@/features/cart/store/useCartStore";
import { useWishlistStore } from "@/features/wishlist/store/useWishlistStore";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { ROLE_BADGES } from "@/features/auth/types";

/**
 * Global site navigation, shown on every page via the root layout.
 */
const NAV_LINKS = [
    { href: "/", label: "Home" },
    { href: "/artworks", label: "Arts" },
    { href: "/fashion", label: "Fashion" },
    { href: "/store", label: "Store" },
    { href: "/gallery", label: "Gallery" },
] as const;

export default function Header() {
    const pathname = usePathname();
    const cartItemCount = useCartStore((state) => state.getTotalItems());
    const wishlistCount = useWishlistStore((state) => state.items.length);
    const { user } = useAuth();

    return (
        <header className="sticky top-0 z-40 w-full border-b border-[#C9A84C]/10 bg-[#0A0F2C]/90 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
                <Link href="/" className="cursor-pointer">
                    <SadafLogo size={38} showText={false} withMarbleBackground={false} />
                </Link>

                <nav className="hidden lg:flex items-center gap-7">
                    {NAV_LINKS.map((link) => {
                        const isActive =
                            link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`text-xs uppercase tracking-[0.2em] font-medium transition-all duration-300 relative py-1 ${
                                    isActive ? "text-[#C9A84C] font-semibold" : "text-[#E8E0D5]/70 hover:text-white"
                                }`}
                            >
                                {link.label}
                                {isActive && (
                                    <span className="absolute bottom-0 inset-x-0 h-[1.5px] bg-[#C9A84C]" />
                                )}
                            </Link>
                        );
                    })}

                    {/* Auth link */}
                    {user ? (
                        <Link
                            href="/dashboard"
                            className={`text-xs uppercase tracking-[0.2em] font-medium transition-all duration-300 relative py-1 flex items-center gap-1.5 ${
                                pathname.startsWith("/dashboard")
                                    ? "text-[#C9A84C] font-semibold"
                                    : "text-[#E8E0D5]/70 hover:text-white"
                            }`}
                        >
                            <span className="w-5 h-5 rounded-full bg-gradient-to-br from-[#C9A84C] to-[#4FC3F7] flex items-center justify-center text-[8px] font-bold text-white shrink-0 overflow-hidden">
                                {user.avatarUrl ? (
                                    <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    user.fullName.charAt(0).toUpperCase()
                                )}
                            </span>
                            <span className="hidden xl:inline">{user.fullName.split(' ')[0]}</span>
                            <span className="hidden 2xl:inline text-[8px] text-[#C9A84C]/70 font-mono tracking-wider">
                                {ROLE_BADGES[user.role] || ''}
                            </span>
                            {pathname.startsWith("/dashboard") && (
                                <span className="absolute bottom-0 inset-x-0 h-[1.5px] bg-[#C9A84C]" />
                            )}
                        </Link>
                    ) : (
                        <Link
                            href="/auth"
                            className={`text-xs uppercase tracking-[0.2em] font-medium transition-all duration-300 relative py-1 flex items-center gap-1.5 ${
                                pathname.startsWith("/auth")
                                    ? "text-[#C9A84C] font-semibold"
                                    : "text-[#E8E0D5]/70 hover:text-white"
                            }`}
                        >
                            <User size={13} />
                            Sign In
                            {pathname.startsWith("/auth") && (
                                <span className="absolute bottom-0 inset-x-0 h-[1.5px] bg-[#C9A84C]" />
                            )}
                        </Link>
                    )}
                </nav>

                <div className="flex items-center gap-4">
                    <Link
                        href="/store"
                        className="p-2 text-slate-300 hover:text-red-400 relative transition-colors duration-300"
                        title="View Wishlist"
                    >
                        <Heart
                            size={16}
                            fill={wishlistCount > 0 ? "red" : "none"}
                            className={wishlistCount > 0 ? "text-red-400" : ""}
                        />
                        {wishlistCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-400 rounded-full" />
                        )}
                    </Link>

                    <Link
                        href="/store"
                        className="p-2 text-slate-300 hover:text-[#C9A84C] relative transition-colors duration-300"
                        title="View Shopping Bag"
                    >
                        <ShoppingCart size={16} />
                        {cartItemCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 bg-[#C9A84C] text-[#0A0F2C] font-mono text-[8px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center border border-[#0A0F2C]">
                                {cartItemCount}
                            </span>
                        )}
                    </Link>
                </div>
            </div>
        </header>
    );
}
