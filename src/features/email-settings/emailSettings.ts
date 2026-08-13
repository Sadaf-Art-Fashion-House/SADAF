/**
 * Email Notification Settings — stores email recipients and preferences
 * in localStorage so the admin/founder can configure who receives
 * automated error reports.
 *
 * In production, replace with a database-backed settings table
 * (e.g. a "settings" collection in Prisma).
 */

import { createLocalStorageSync } from '@/shared/utils/localStorageSync';

const STORAGE_KEY = 'sadaf_email_settings';
const CHANGED_EVENT = 'sadaf:email-settings-changed';

/**
 * Persistence + cross-tab sync (custom window event + native storage event)
 * so both admin/founder email-settings pages reflect changes instantly.
 */
const emailSettingsSync = createLocalStorageSync<EmailSettings>(STORAGE_KEY, CHANGED_EVENT);

export interface EmailSettings {
    recipients: string[];
    notifyOnError: boolean;
    digestMode: 'immediate' | 'daily' | 'weekly';
    includeStackTrace: boolean;
}

const DEFAULT_SETTINGS: EmailSettings = {
    recipients: [],
    notifyOnError: false,
    digestMode: 'immediate',
    includeStackTrace: true,
};

/** Retrieve email notification settings from localStorage. */
export function getEmailSettings(): EmailSettings {
    const stored = emailSettingsSync.load();
    return stored ? { ...DEFAULT_SETTINGS, ...stored } : DEFAULT_SETTINGS;
}

/** Save email notification settings to localStorage. */
export function saveEmailSettings(settings: EmailSettings): void {
    emailSettingsSync.save(settings);
}

/**
 * Subscribe to email-settings changes (in-tab custom event + cross-tab
 * `storage` event). Returns an unsubscribe function — the email-settings
 * page uses it to refresh the moment settings change in another tab.
 */
export function subscribeEmailSettings(listener: () => void): () => void {
    return emailSettingsSync.subscribe(listener);
}

/** Add an email recipient to the notification list. */
export function addRecipient(email: string): EmailSettings {
    const settings = getEmailSettings();
    const normalized = email.trim().toLowerCase();
    if (!normalized || settings.recipients.includes(normalized)) return settings;
    const updated = {
        ...settings,
        recipients: [...settings.recipients, normalized],
    };
    saveEmailSettings(updated);
    return updated;
}

/** Remove an email recipient from the notification list. */
export function removeRecipient(email: string): EmailSettings {
    const settings = getEmailSettings();
    const updated = {
        ...settings,
        recipients: settings.recipients.filter((r) => r !== email),
    };
    saveEmailSettings(updated);
    return updated;
}

/**
 * Build an HTML email body from a list of error log entries.
 */
export function buildErrorEmailHtml(
    errors: Array<{ message: string; stack?: string; url: string; timestamp: string; digest?: string }>,
    includeStack: boolean
): string {
    const rows = errors
        .map(
            (e, i) => `
        <tr style="border-bottom:1px solid #eee;">
            <td style="padding:8px;font-size:12px;color:#666;">#${i + 1}</td>
            <td style="padding:8px;font-size:12px;color:#333;font-family:monospace;">${e.message}</td>
            <td style="padding:8px;font-size:11px;color:#888;">${new Date(e.timestamp).toLocaleString()}</td>
            <td style="padding:8px;font-size:11px;color:#888;max-width:200px;overflow:hidden;text-overflow:ellipsis;">${e.url}</td>
        </tr>`
        )
        .join('');

    const stacks = includeStack
        ? errors
              .filter((e) => e.stack)
              .map(
                  (e) => `
        <h3 style="font-size:13px;color:#c0392b;margin-top:20px;">Stack: ${e.message}</h3>
        <pre style="background:#f5f5f5;padding:12px;border-radius:4px;font-size:11px;color:#333;overflow-x:auto;white-space:pre-wrap;">${e.stack}</pre>`
              )
              .join('')
        : '';

    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f9f9f9;padding:20px;">
    <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
        <div style="background:#c0392b;padding:20px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:20px;">⚠️ SADAF Error Report</h1>
        </div>
        <div style="padding:20px;">
            <p style="font-size:14px;color:#555;">The following errors were detected on your platform:</p>
            <table style="width:100%;border-collapse:collapse;margin-top:15px;">
                <thead>
                    <tr style="background:#f0f0f0;">
                        <th style="padding:8px;text-align:left;font-size:11px;color:#666;">#</th>
                        <th style="padding:8px;text-align:left;font-size:11px;color:#666;">Message</th>
                        <th style="padding:8px;text-align:left;font-size:11px;color:#666;">Time</th>
                        <th style="padding:8px;text-align:left;font-size:11px;color:#666;">URL</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
            ${stacks}
            <p style="font-size:11px;color:#999;margin-top:20px;border-top:1px solid #eee;padding-top:10px;">
                Sent automatically by SADAF Error Monitor &bull; ${new Date().toLocaleString()}
            </p>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Send error logs via email using the SMTP API endpoint.
 * Returns a result object indicating success or failure.
 */
export async function sendErrorReportByEmail(
    errors: Array<{ message: string; stack?: string; url: string; timestamp: string; digest?: string }>,
    settings: EmailSettings
): Promise<{ ok: boolean; error?: string }> {
    if (settings.recipients.length === 0) {
        return { ok: false, error: 'No email recipients configured' };
    }

    const subject = `[SADAF Error] ${errors.length} error${errors.length !== 1 ? 's' : ''} detected`;

    try {
        const res = await fetch('/api/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: settings.recipients,
                subject,
                text: `SADAF Error Report\n\n${errors.length} error(s) detected.\n\n${errors
                    .map(
                        (e) =>
                            `[${new Date(e.timestamp).toLocaleString()}] ${e.message}\nURL: ${e.url}\n${settings.includeStackTrace && e.stack ? `Stack: ${e.stack}\n` : ''}`
                    )
                    .join('\n---\n')}`,
                html: buildErrorEmailHtml(errors, settings.includeStackTrace),
            }),
        });

        if (!res.ok) {
            const data = await res.json();
            return { ok: false, error: data.error || data.details || 'Failed to send email' };
        }

        return { ok: true };
    } catch (error) {
        return {
            ok: false,
            error: error instanceof Error ? error.message : 'Network error',
        };
    }
}
