import { createClient } from '@supabase/supabase-js';
import { config } from './config';
import type { UserProfile } from '@/shared/types';

export const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);

export async function getFashionProducts() {
    const { data, error } = await supabase.from('products').select('*').not('category', 'like', 'Art%').eq('in_stock', true);

    if (error) {
        console.error('Error fetching products:', error);
        return [];
    }

    return data;
}

export async function getArtworks() {
    const { data, error } = await supabase.from('products').select('*').like('category', 'Art%').eq('in_stock', true);

    if (error) {
        console.error('Error fetching artworks:', error);
        return [];
    }

    return data;
}

export const isSupabaseConfigured = !!(
    config.supabaseUrl &&
    config.supabaseAnonKey &&
    config.supabaseUrl !== '' &&
    config.supabaseAnonKey !== ''
);

const MOCK_USERS_KEY = 'sadaf_mock_users';
const MOCK_CURRENT_KEY = 'sadaf_mock_current';

const defaultUsers: UserProfile[] = [
    {
        id: 'usr-1',
        email: 'layla@sadaf.luxury',
        role: 'customer_individual',
        fullName: 'Customer Layla',
        createdAt: new Date().toISOString(),
        referralCode: 'SADAF-LAYLA-7X2',
        connections: ['usr-2'],
    },
    {
        id: 'usr-2',
        email: 'amir@sadaf.luxury',
        role: 'customer_family',
        fullName: 'Family Amir',
        createdAt: new Date().toISOString(),
        referralCode: 'SADAF-AMIR-K9M',
        referredBy: 'SADAF-LAYLA-7X2',
    },
    {
        id: 'usr-3',
        email: 'nadia@sadaf.luxury',
        role: 'customer_friend',
        fullName: 'Friend Nadia',
        createdAt: new Date().toISOString(),
        referralCode: 'SADAF-NADIA-R4P',
        referredBy: 'SADAF-LAYLA-7X2',
    },
    {
        id: 'usr-4',
        email: 'karim@sadaf.luxury',
        role: 'designer',
        fullName: 'Designer Karim',
        createdAt: new Date().toISOString(),
        referralCode: 'SADAF-KARIM-T8W',
    },
    {
        id: 'usr-5',
        email: 'nile@sadaf.luxury',
        role: 'company',
        fullName: 'Nile Designs Co.',
        createdAt: new Date().toISOString(),
        referralCode: 'SADAF-NILE-B3V',
        city: 'Cairo',
        focus: 'Bridal & Occasion Wear',
    },
    {
        id: 'usr-6',
        email: 'saleh@sadaf.luxury',
        role: 'sales_partner',
        fullName: 'Saleh Partner',
        createdAt: new Date().toISOString(),
        referralCode: 'SADAF-SALEH-D6N',
    },
    {
        id: 'usr-7',
        email: 'admin@sadaf.luxury',
        role: 'admin_super',
        fullName: 'Admin Amir',
        createdAt: new Date().toISOString(),
        referralCode: 'SADAF-ADMIN-H4J',
    },
    {
        id: 'usr-8',
        email: 'yasmin@sadaf.luxury',
        role: 'founder',
        fullName: 'Founder Yasmine',
        createdAt: new Date().toISOString(),
        referralCode: 'SADAF-FOUNDER-Z1Q',
    },
];

export const mockAuth = {
    getUsers: (): UserProfile[] => {
        try {
            const stored = window.localStorage.getItem(MOCK_USERS_KEY);
            return stored ? JSON.parse(stored) : defaultUsers;
        } catch {
            return defaultUsers;
        }
    },
    saveUsers: (users: UserProfile[]) => {
        window.localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
    },
    setCurrentUser: (user: UserProfile | null) => {
        if (user) {
            window.localStorage.setItem(MOCK_CURRENT_KEY, JSON.stringify(user));
        } else {
            window.localStorage.removeItem(MOCK_CURRENT_KEY);
        }
    },
    getCurrentUser: (): UserProfile | null => {
        try {
            const stored = window.localStorage.getItem(MOCK_CURRENT_KEY);
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    },
    clearCurrentUser: () => {
        window.localStorage.removeItem(MOCK_CURRENT_KEY);
    },
};
