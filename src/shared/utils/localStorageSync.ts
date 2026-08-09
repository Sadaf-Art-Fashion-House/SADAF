/**
 * SADAF | Shared — localStorage Sync Utility
 *
 * Generic version of the reviews sync pattern (see
 * features/reviews/utils/userReviewsStorage.ts) used by every piece of
 * localStorage-backed data so they all behave the same:
 *
 *   - The tab that saves writes localStorage AND dispatches a custom window
 *     event so same-tab listeners refresh the moment data changes.
 *   - Other tabs pick the change up via the native `storage` event the
 *     browser fires automatically when localStorage changes.
 *
 * All window/localStorage access is guarded (SSR-safe). Read/write failures
 * (private mode, quota) never throw — the in-memory state keeps working.
 */

export interface LocalStorageSync<T> {
    /** Read the persisted value (null when missing or unreadable). */
    load: () => T | null;
    /** Persist the value and notify same-tab listeners via the custom event. */
    save: (value: T) => void;
    /** Remove the persisted value and notify listeners. */
    remove: () => void;
    /**
     * Listen for changes from this tab (custom event) and other tabs
     * (native storage event, filtered to this key). Returns an unsubscribe
     * function.
     */
    subscribe: (listener: () => void) => () => void;
}

export function createLocalStorageSync<T>(key: string, eventName: string): LocalStorageSync<T> {
    const load = (): T | null => {
        if (typeof window === 'undefined') return null;
        try {
            const raw = window.localStorage.getItem(key);
            if (!raw) return null;
            return JSON.parse(raw) as T;
        } catch {
            return null;
        }
    };

    const save = (value: T): void => {
        if (typeof window === 'undefined') return;
        try {
            window.localStorage.setItem(key, JSON.stringify(value));
            window.dispatchEvent(new CustomEvent(eventName));
        } catch {
            // Storage unavailable (private mode / quota) — in-memory state still works.
        }
    };

    const remove = (): void => {
        if (typeof window === 'undefined') return;
        try {
            window.localStorage.removeItem(key);
            window.dispatchEvent(new CustomEvent(eventName));
        } catch {
            // Same as save — never break the caller.
        }
    };

    const subscribe = (listener: () => void): (() => void) => {
        if (typeof window === 'undefined') return () => {};

        const onCustomEvent = (): void => listener();
        const onStorageEvent = (event: StorageEvent): void => {
            // `key === null` covers a full localStorage.clear() in another tab.
            if (event.key === key || event.key === null) listener();
        };

        window.addEventListener(eventName, onCustomEvent);
        window.addEventListener('storage', onStorageEvent);
        return () => {
            window.removeEventListener(eventName, onCustomEvent);
            window.removeEventListener('storage', onStorageEvent);
        };
    };

    return { load, save, remove, subscribe };
}
