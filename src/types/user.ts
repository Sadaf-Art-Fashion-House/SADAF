export interface UserProfile {
    id: string;
    email: string;
    role: 'customer' | 'admin' | 'founder';
    name?: string;
    fullName?: string;
    createdAt: string;
}
