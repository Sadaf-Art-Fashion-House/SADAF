import type { Metadata } from 'next';
import CompanyHomePageClient from './CompanyHomePageClient';
import CompanyHomeView from '@/features/company/components/CompanyHomeView';

export const metadata: Metadata = {
    title: 'Company Workspace | SADAF',
    description: 'Partner with SADAF designers, manage brand collaborations, and grow your business.',
};

/**
 * Company Workspace home — a landing hub for the company route group. The
 * first section is the Connections hub; more sections (B2B orders, bulk
 * pricing, AI Studio access) will slot in below it.
 */
export default function CompanyHomePage() {
    return (
        <div className="relative w-full min-h-screen pb-20">
            {/* Welcome-back confirmation toast after a successful login
                (reads ?signedIn=1 set by the auth page). */}
            <CompanyHomePageClient />
            <CompanyHomeView />
        </div>
    );
}
