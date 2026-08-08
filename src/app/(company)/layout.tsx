/**
 * Company route group layout.
 * Includes a persistent sidebar for cross-platform navigation.
 * No site Header — company views have their own full navigation.
 * Used for /dashboard/company and any future company-only routes.
 */
import CompanySidebar from '@/features/company/components/CompanySidebar';

export default function CompanyGroupLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen">
            <CompanySidebar />
            <main className="flex-1 transition-all duration-300">
                {children}
            </main>
        </div>
    );
}
