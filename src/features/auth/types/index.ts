import type { UserProfile, UserRole } from '@/shared/types';

export type { UserProfile, UserRole };

export interface SignUpData {
    fullName: string;
    email: string;
    password: string;
    role: UserRole;
    secretPasscode?: string;
    hasDesignerAccess?: boolean;
    /** Referral code from an existing customer (required for customer_family / customer_friend) */
    referralCode?: string;
    /** Extra fields for application-based roles (designer, company, sales_partner) */
    applicationData?: Record<string, string>;
}

export interface AuthStoreState {
    user: UserProfile | null;
    isLoading: boolean;
}

/**
 * Human-readable labels for each role, used in signup forms and badges.
 */
export const ROLE_LABELS: Record<UserRole, string> = {
    customer_individual: 'Customer (Individual)',
    customer_family: 'Customer (Family)',
    customer_friend: 'Customer (Friend)',
    designer: 'Designer',
    company: 'Company / Brand',
    sales_partner: 'Sales Partner',
    admin_sales: 'Admin — Sales',
    admin_media: 'Admin — Media',
    admin_sales_media: 'Admin — Sales & Media',
    admin_software: 'Admin — Software',
    admin_super: 'Admin — Super',
    founder: 'Founder',
};

/**
 * Short badge labels for each role.
 */
export const ROLE_BADGES: Record<string, string> = {
    customer_individual: 'Individual',
    customer_family: 'Family',
    customer_friend: 'Friend',
    designer: 'Designer',
    company: 'Company',
    sales_partner: 'Sales Partner',
    admin_sales: 'Sales Admin',
    admin_media: 'Media Admin',
    admin_sales_media: 'Sales & Media',
    admin_software: 'Software Admin',
    admin_super: 'Super Admin',
    founder: 'Founder',
};

/**
 * Which roles require a secret passcode to sign up (elevated access).
 */
export const ELEVATED_ROLES: UserRole[] = [
    'admin_sales',
    'admin_media',
    'admin_sales_media',
    'admin_software',
    'admin_super',
    'founder',
];

/**
 * Customer sub-types that require a valid referral code from an existing customer.
 * This prevents unauthorised signups from claiming family/friend benefits.
 */
export const REFERRAL_REQUIRED_ROLES: UserRole[] = ['customer_family', 'customer_friend'];

/**
 * Roles that require an application with extra validation fields.
 * These aren't instantly created — they submit an application that gets reviewed.
 */
export const APPLICATION_REQUIRED_ROLES: UserRole[] = ['designer', 'company', 'sales_partner'];

/**
 * Configuration for the extra fields shown during signup for each application role.
 */
export interface ApplicationField {
    key: string;
    label: string;
    placeholder: string;
    type: 'text' | 'url' | 'textarea' | 'tel';
    required: boolean;
    description?: string;
}

export const APPLICATION_FIELDS: Record<UserRole, ApplicationField[]> = {
    designer: [
        {
            key: 'portfolioUrl',
            label: 'Portfolio Link',
            placeholder: 'https://behance.net/your-portfolio',
            type: 'url',
            required: true,
            description: 'Link to your design portfolio (Behance, Dribbble, personal site, etc.)',
        },
        {
            key: 'designExperience',
            label: 'Design Experience',
            placeholder: 'e.g. 5 years in fashion design, 3 years in graphic design',
            type: 'text',
            required: true,
            description: 'How many years of experience and what type of design work',
        },
        {
            key: 'specializations',
            label: 'Specializations',
            placeholder: 'e.g. Calligraphy, Digital Art, Textile Patterns',
            type: 'text',
            required: false,
            description: 'Areas you specialise in (optional)',
        },
    ],
    company: [
        {
            key: 'companyName',
            label: 'Company / Brand Name',
            placeholder: 'e.g. Nile Designs Co.',
            type: 'text',
            required: true,
        },
        {
            key: 'registrationNumber',
            label: 'Business Registration Number',
            placeholder: 'e.g. CR-2024-7X2',
            type: 'text',
            required: true,
            description: 'Official business registration or tax ID',
        },
        {
            key: 'businessType',
            label: 'Business Type',
            placeholder: 'e.g. Fashion Brand, Design Studio, Retail',
            type: 'text',
            required: true,
        },
        {
            key: 'website',
            label: 'Company Website',
            placeholder: 'https://your-company.com',
            type: 'url',
            required: false,
            description: 'Website OR Social Media (at least one required for verification)',
        },
        {
            key: 'socialMediaUrl',
            label: 'Social Media Page',
            placeholder: 'https://instagram.com/your-brand',
            type: 'url',
            required: false,
            description: 'Website OR Social Media (at least one required for verification)',
        },
    ],
    sales_partner: [
        {
            key: 'salesExperience',
            label: 'Sales Experience',
            placeholder: 'e.g. 3 years in luxury retail, 2 years in wholesale',
            type: 'text',
            required: true,
            description: 'Your background in sales or brand representation',
        },
        {
            key: 'region',
            label: 'Target Region / City',
            placeholder: 'e.g. Cairo, Alexandria, GCC',
            type: 'text',
            required: true,
            description: 'Where you plan to represent SADAF',
        },
        {
            key: 'phoneNumber',
            label: 'Phone Number',
            placeholder: '+20 100 000 0000',
            type: 'tel',
            required: true,
            description: 'For direct contact from our partnerships team',
        },
    ],
    customer_individual: [],
    customer_family: [],
    customer_friend: [],
    admin_sales: [],
    admin_media: [],
    admin_sales_media: [],
    admin_software: [],
    admin_super: [],
    founder: [],
};

/**
 * Role badge colours for the UI.
 */
export const ROLE_BADGE_COLORS: Record<string, string> = {
    customer_individual: 'bg-[#4FC3F7]/10 text-[#4FC3F7] border-[#4FC3F7]/30',
    customer_family: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    customer_friend: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    designer: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
    company: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    sales_partner: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    admin_sales: 'bg-[#C9A84C]/10 text-[#C9A84C] border-[#C9A84C]/30',
    admin_media: 'bg-[#C9A84C]/10 text-[#C9A84C] border-[#C9A84C]/30',
    admin_sales_media: 'bg-[#C9A84C]/10 text-[#C9A84C] border-[#C9A84C]/30',
    admin_software: 'bg-[#C9A84C]/10 text-[#C9A84C] border-[#C9A84C]/30',
    admin_super: 'bg-[#C9A84C]/10 text-[#C9A84C] border-[#C9A84C]/30',
    founder: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
};
