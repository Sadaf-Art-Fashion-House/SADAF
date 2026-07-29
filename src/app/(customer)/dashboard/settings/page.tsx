import type { Metadata } from 'next';
import WatermarkSettingsPageClient from './WatermarkSettingsPageClient';

export const metadata: Metadata = {
    title: 'Settings | SADAF Atelier',
    description: 'Customise your dashboard experience — watermark, export, and display preferences.',
};

export default function SettingsPage() {
    return <WatermarkSettingsPageClient />;
}
