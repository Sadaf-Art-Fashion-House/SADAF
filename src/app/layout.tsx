import type { Metadata } from "next";
import Header from "@/shared/layout/Header";
import { AppProviders } from "@/shared/providers/AppProviders";
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
                <AppProviders>
                    <Header />
                    {children}
                </AppProviders>
            </body>
        </html>
    );
}
