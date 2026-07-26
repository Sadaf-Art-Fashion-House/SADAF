/**
 * Founder route group layout.
 * Includes a persistent sidebar for cross-platform navigation.
 * No site Header — founder views have their own full navigation.
 * Used for /dashboard/founder.
 */
import AdminSidebar from "@/features/admin/components/AdminSidebar";

export default function FounderGroupLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen">
            <AdminSidebar />
            <main className="flex-1 transition-all duration-300">
                {children}
            </main>
        </div>
    );
}
