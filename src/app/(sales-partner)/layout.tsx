/**
 * Sales Partner route group layout.
 * Includes a persistent sidebar for cross-platform navigation.
 * No site Header — partner views have their own full navigation.
 * Used for /dashboard/sales-partner and any future partner-only routes.
 */
import SalesPartnerSidebar from "@/features/sales-partner/components/SalesPartnerSidebar";

export default function SalesPartnerGroupLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen">
            <SalesPartnerSidebar />
            <main className="flex-1 transition-all duration-300">
                {children}
            </main>
        </div>
    );
}
