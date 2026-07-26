/**
 * Customer route group layout.
 * Includes the site Header and a persistent sidebar for navigation.
 * Used for /dashboard (user dashboard) and /dashboard/profile.
 */
import Header from "@/shared/layout/Header";
import CustomerSidebar from "@/features/customer/components/CustomerSidebar";

export default function CustomerGroupLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <Header />
            <div className="flex min-h-[calc(100vh-5rem)]">
                <CustomerSidebar />
                <main className="flex-1 transition-all duration-300">
                    {children}
                </main>
            </div>
        </>
    );
}
