/**
 * Admin route group layout.
 * Includes a persistent sidebar for cross-platform navigation.
 * No site Header — admin views have their own full admin navigation.
 * Used for /dashboard/admin and any future admin-only routes.
 */
import AdminSidebar from "@/features/admin/components/AdminSidebar";

export default function AdminGroupLayout({
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
