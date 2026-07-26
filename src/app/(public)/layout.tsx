/**
 * Public route group layout.
 * Includes the site Header for navigation.
 * Used for all public-facing pages: artworks, fashion, store, gallery, ai,
 * cart, checkout, wishlist, exhibition.
 */
import Header from "@/shared/layout/Header";

export default function PublicGroupLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <Header />
            {children}
        </>
    );
}
