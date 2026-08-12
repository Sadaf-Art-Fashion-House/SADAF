/**
 * SADAF | Connections — Feature Constants
 *
 * Single source of truth for the status chip styling shared by the company
 * and designer views of the connections hub.
 */

import type { ConnectionStatus } from '../types';
import type { TranslationKey } from '@/features/i18n/dictionaries';

/** i18n key + chip colors per connection status. The label is translated at
 *  render time via the active language (labelKey → t()). */
export const CONNECTION_STATUS_STYLES: Record<
    ConnectionStatus,
    { labelKey: TranslationKey; chip: string; dot: string }
> = {
    pending: { labelKey: 'connections.status.pending', chip: 'bg-amber-500/10 text-amber-400 border-amber-500/30', dot: 'bg-amber-400' },
    accepted: { labelKey: 'connections.status.active', chip: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-400' },
    declined: { labelKey: 'connections.status.declined', chip: 'bg-red-500/10 text-red-400 border-red-500/30', dot: 'bg-red-400' },
};
