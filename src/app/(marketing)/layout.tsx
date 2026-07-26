/**
 * Marketing route group layout (Home page).
 * Includes the site Header so visitors can navigate to all public pages.
 */
import Header from "@/shared/layout/Header";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Header />
      {children}
    </>
  );
}
