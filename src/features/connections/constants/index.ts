/**
 * SADAF | Connections — Feature Constants
 *
 * Single source of truth for the status chip styling shared by the company
 * and designer views of the connections hub.
 */

import type { ConnectionStatus } from '../types';

/** Human-readable label + chip colors per connection status. */
export const CONNECTION_STATUS_STYLES: Record<
    ConnectionStatus,
    { label: string; chip: string; dot: string }
> = {
    pending: { label: 'Pending', chip: 'bg-amber-500/10 text-amber-400 border-amber-500/30', dot: 'bg-amber-400' },
    accepted: { label: 'Active', chip: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-400' },
    declined: { label: 'Declined', chip: 'bg-red-500/10 text-red-400 border-red-500/30', dot: 'bg-red-400' },
};
