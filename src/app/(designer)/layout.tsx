/**
 * Designer route group layout.
 * Includes a persistent sidebar for cross-platform navigation.
 * No site Header — designer views have their own full navigation.
 * Used for /dashboard/designer and any future designer-only routes.
 */
import DesignerSidebar from "@/features/designer/components/DesignerSidebar";

export default function DesignerGroupLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen">
            <DesignerSidebar />
            <main className="flex-1 transition-all duration-300">
                {children}
            </main>
        </div>
    );
}
