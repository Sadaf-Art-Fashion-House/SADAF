import type { Metadata } from "next";
import { AppProviders } from "@/shared/providers/AppProviders";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";
import "./globals.css";

export const metadata: Metadata = {
    title: "SADAF | AI Luxury Fashion & Art Platform",
    description: "A production-ready architecture foundation for the SADAF platform.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="h-full antialiased">
            <body className="min-h-full flex flex-col">
                <ErrorBoundary label="app">
                    <AppProviders>{children}</AppProviders>
                </ErrorBoundary>
            </body>
        </html>
    );
}
