/**
 * Founder route group layout.
 * Includes a persistent sidebar for cross-platform navigation.
 * No site Header — founder views have their own full navigation.
 * Used for /dashboard/founder.
 */
import FounderSidebar from "@/features/admin/components/FounderSidebar";

export default function FounderGroupLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen">
            <FounderSidebar />
            <main className="flex-1 transition-all duration-300">
                {children}
            </main>
        </div>
    );
}
