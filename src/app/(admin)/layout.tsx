/**
 * Admin route group layout.
 * Includes the site Header and a persistent sidebar for navigation.
 * Used for /dashboard/admin and any future admin-only routes.
 */
import Header from "@/shared/layout/Header";
import AdminSidebar from "@/features/admin/components/AdminSidebar";

export default function AdminGroupLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <Header />
            <div className="flex min-h-[calc(100vh-5rem)]">
                <AdminSidebar />
                <main className="flex-1 transition-all duration-300">
                    {children}
                </main>
            </div>
        </>
    );
}
