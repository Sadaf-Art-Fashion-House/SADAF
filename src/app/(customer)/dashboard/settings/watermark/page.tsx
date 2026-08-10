import type { Metadata } from 'next';
import WatermarkSettingsPageClient from '../WatermarkSettingsPageClient';

export const metadata: Metadata = {
    title: 'Watermark & Export | SADAF Atelier',
    description: 'Watermark text, logo placement, and export defaults for your reports.',
};

export default function WatermarkSettingsPage() {
    return <WatermarkSettingsPageClient />;
}
