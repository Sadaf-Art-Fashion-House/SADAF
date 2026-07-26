/**
 * Auth route group layout.
 * Clean minimal layout — no site Header (shown on public pages only).
 * Used for login, signup, password reset, etc.
 */
export default function AuthGroupLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
