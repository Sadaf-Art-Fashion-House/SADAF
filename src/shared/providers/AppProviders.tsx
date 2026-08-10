import type { ReactNode } from 'react';

import { AuthProvider } from '@/features/auth/hooks/useAuth';
import { LanguageProvider } from '@/features/i18n/LanguageProvider';
import BrowserNotificationsBridge from '@/features/notifications/components/BrowserNotificationsBridge';

interface AppProvidersProps {
    children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
    return (
        <AuthProvider>
            <LanguageProvider>
                <BrowserNotificationsBridge />
                {children}
            </LanguageProvider>
        </AuthProvider>
    );
}
