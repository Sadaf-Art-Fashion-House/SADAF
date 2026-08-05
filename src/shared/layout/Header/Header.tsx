"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Heart, ShoppingCart, User, ChevronDown, Search, MessageSquare } from "lucide-react";
import SadafLogo from "@/components/common/SadafLogo";
import NotificationBell from "@/features/notifications/components/NotificationBell";
import FriendRequestsBadge from "@/features/community/components/FriendRequestsBadge";
import { useCartStore } from "@/features/cart/store/useCartStore";
import { useWishlistStore } from "@/features/wishlist/store/useWishlistStore";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { ROLE_BADGES } from "@/features/auth/types";
import { NAV_LINKS, DROPDOWN_LINKS } from "@/config/routes";

export default function Header() {
    const pathname = usePathname();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const cartItemCount = useCartStore((state) => state.getTotalItems());
    const wishlistCount = useWishlistStore((state) => state.items.length);
    const { user } = useAuth();

    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const isDropdownActive = DROPDOWN_LINKS.some((link) => pathname.startsWith(link.href));

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

                    {/* Dropdown: More */}
                    <div ref={dropdownRef} className="relative">
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className={`flex items-center gap-1 text-xs uppercase tracking-[0.2em] font-medium transition-all duration-300 relative py-1 cursor-pointer ${
                                isDropdownActive
                                    ? "text-[#C9A84C] font-semibold"
                                    : "text-[#E8E0D5]/70 hover:text-white"
                            }`}
                        >
                            More
                            <ChevronDown
                                size={10}
                                className={`transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                            />
                            {isDropdownActive && (
                                <span className="absolute bottom-0 inset-x-0 h-[1.5px] bg-[#C9A84C]" />
                            )}
                        </button>

                        <AnimatePresence>
                            {dropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                                    transition={{ duration: 0.15, ease: "easeOut" }}
                                    className="absolute top-full right-0 mt-2 w-56 bg-[#0A0F2C]/98 border border-[#C9A84C]/15 rounded-xl shadow-2xl shadow-black/60 backdrop-blur-xl overflow-hidden z-50"
                                >
                                    {DROPDOWN_LINKS.map((item, idx) => {
                                        const isItemActive = pathname.startsWith(item.href);
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={() => setDropdownOpen(false)}
                                                className={`flex flex-col px-5 py-3.5 transition-all duration-200 group ${
                                                    isItemActive
                                                        ? "bg-[#C9A84C]/10 text-[#C9A84C]"
                                                        : "text-[#E8E0D5]/70 hover:bg-white/5 hover:text-white"
                                                } ${idx < DROPDOWN_LINKS.length - 1 ? "border-b border-white/5" : ""}`}
                                            >
                                                <span className="text-xs uppercase tracking-[0.15em] font-semibold">
                                                    {item.label}
                                                </span>
                                                <span className="text-[10px] text-[#E8E0D5]/40 group-hover:text-[#E8E0D5]/60 mt-0.5">
                                                    {item.desc}
                                                </span>
                                            </Link>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

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
                        href="/search"
                        className="p-2 text-slate-300 hover:text-[#C9A84C] relative transition-colors duration-300"
                        title="Search Atelier"
                    >
                        <Search size={16} />
                    </Link>

                    <FriendRequestsBadge />

                    <NotificationBell />

                    <Link
                        href="/reviews"
                        className="p-2 text-slate-300 hover:text-[#C9A84C] relative transition-colors duration-300"
                        title="Customer Reviews"
                    >
                        <MessageSquare size={16} />
                    </Link>

                    <Link
                        href="/wishlist"
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
                        href="/cart"
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
