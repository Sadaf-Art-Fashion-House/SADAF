/**
 * Founder route group layout.
 * Includes the site Header and a persistent sidebar for navigation.
 * Used for /dashboard/founder.
 */
import Header from "@/shared/layout/Header";
import FounderSidebar from "@/features/admin/components/FounderSidebar";

export default function FounderGroupLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <Header />
            <div className="flex min-h-[calc(100vh-5rem)]">
                <FounderSidebar />
                <main className="flex-1 transition-all duration-300">
                    {children}
                </main>
            </div>
        </>
    );
}
