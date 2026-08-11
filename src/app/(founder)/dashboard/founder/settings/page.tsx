import type { Metadata } from 'next';
import SettingsPageClient from '@/features/settings/components/SettingsPageClient';

export const metadata: Metadata = {
    title: 'Settings | SADAF Atelier',
    description: 'Customise your SADAF experience — language, appearance, accessibility, notifications, privacy and data.',
};

export default function FounderSettingsPage() {
    return <SettingsPageClient />;
}
