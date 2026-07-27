/**
 * Customer route group layout.
 * Includes a persistent sidebar for cross-platform navigation.
 * No site Header — customer dashboard views have their own navigation.
 * Used for /dashboard (user dashboard) and /dashboard/profile.
 */
import CustomerSidebar from "@/features/customer/components/CustomerSidebar";

export default function CustomerGroupLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen">
            <CustomerSidebar />
            <main className="flex-1 transition-all duration-300">
                {children}
            </main>
        </div>
    );
}
