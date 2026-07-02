import { useMemo } from 'react';

export function useAppNavigation(currentTab: string) {
    return useMemo(() => ({
        isActive: (tabId: string) => currentTab === tabId
    }), [currentTab]);
}
