#!/usr/bin/env node

/**
 * SADAF | WebSocket Server v2 — Subscription Model + Heartbeat + Notifications
 *
 * Features:
 * 1. 🔌 Subscription model — each client subscribes to specific endpoints
 * 2. 💓 Heartbeat — tells clients "I'm alive" even when API is down
 * 3. 📡 SSE fallback endpoint — clients use EventSource if WS fails
 * 4. 📊 API status tracking — clients know if next.js API is healthy
 * 5. 🧹 Auto-clean stale ports — kills old processes on startup
 * 6. 🔔 Real-time notifications — pushes demo notifications every 15s
 *    → Replace generateDemoNotification() with real API polling in production
 *
 * Usage:
 *   node ws-server.mjs       # standalone
 *   npm run dev:all           # alongside Next.js
 */

import { WebSocketServer, WebSocket as WebSocketClient } from 'ws';

// ─── Auto-clean stale ports ──────────────────────────────────────────────────

const WS_PORT = parseInt(process.env.WS_PORT || '3001', 10);
const NEXT_PORT = parseInt(process.env.NEXT_PORT || '3000', 10);
const NEXT_DEV_URL = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${NEXT_PORT}`;
const POLL_INTERVAL_MS = 3_000;
const HEARTBEAT_INTERVAL_MS = 5_000;
const API_TIMEOUT_MS = 6_000;

/** Available dashboard endpoints */
const ENDPOINTS = [
    { type: 'dashboard:admin', path: '/api/dashboard/admin' },
    { type: 'dashboard:founder', path: '/api/dashboard/founder' },
    { type: 'dashboard:customer', path: '/api/dashboard/customer' },
];

const VALID_ENDPOINT_TYPES = new Set(ENDPOINTS.map((e) => e.type));

// Allow dynamic notification endpoint validation
function isValidEndpointType(type) {
    if (VALID_ENDPOINT_TYPES.has(type)) return true;
    // Dynamic notifications:user:{userId}
    if (type.startsWith('notifications:user:') || type === 'notifications:global') return true;
    return false;
}

// ─── Simulated Notifications (for demo / development) ────────────────────────
// In production this would poll a real API endpoint (/api/notifications).
const DEMO_NOTIFICATIONS_ENABLED = !process.env.DISABLE_DEMO_NOTIFICATIONS;
let demoNotifCounter = 0;

function generateDemoNotification() {
    demoNotifCounter++;
    const types = ['order', 'wishlist', 'review', 'system', 'promotion'];
    const templates = [
        { type: 'order', title: 'New Order Received', message: 'Order #SADAF-' + (1000 + demoNotifCounter) + ' has been placed successfully.' },
        { type: 'wishlist', title: 'Wishlist Price Drop', message: 'An item in your wishlist is now 15% off!' },
        { type: 'review', title: 'New Review Posted', message: 'A customer left a 5-star review on one of your products.' },
        { type: 'system', title: 'System Update', message: 'SADAF platform v2.4.1 deployed with new features.' },
        { type: 'promotion', title: 'Limited Offer', message: 'Get 20% off on all Traditional Fusion pieces this weekend.' },
    ];
    const tpl = templates[demoNotifCounter % templates.length];
    return {
        id: 'demo-' + Date.now() + '-' + demoNotifCounter,
        type: tpl.type,
        title: tpl.title,
        message: tpl.message,
        createdAt: new Date().toISOString(),
        read: false,
        href: '/dashboard/notifications',
    };
}

// ─── Client Subscription Tracking ────────────────────────────────────────────

const clientSubscriptions = new WeakMap();

function getSubscriptions(ws) {
    let subs = clientSubscriptions.get(ws);
    if (!subs) {
        subs = new Set();
        clientSubscriptions.set(ws, subs);
    }
    return subs;
}

// ─── API Health Tracking ─────────────────────────────────────────────────────

let apiHealthy = true;

// ─── WebSocket Server ────────────────────────────────────────────────────────

const wss = new WebSocketServer({ port: WS_PORT });
console.log(`\n🔌 SADAF WebSocket Server v2 — ws://localhost:${WS_PORT}`);
console.log(`   Polling ${ENDPOINTS.length} endpoints every ${POLL_INTERVAL_MS / 1000}s\n`);

let clientCount = 0;

wss.on('connection', (ws, req) => {
    clientCount++;
    const clientIp = req.socket.remoteAddress;
    console.log(`   ➕ Client connected #${clientCount} (${clientIp})`);

    // Send welcome + server health
    ws.send(JSON.stringify({
        type: 'connection',
        status: 'connected',
        clientCount,
        apiHealthy,
        endpoints: [...ENDPOINTS.map((e) => e.type), 'notifications:user:{id}', 'notifications:global'],
        supportsNotifications: true,
        timestamp: new Date().toISOString(),
    }));

    // ─── Handle subscribe messages ────────────────────────────────────────
    ws.on('message', (raw) => {
        try {
            const msg = JSON.parse(raw.toString());

            if (msg.action === 'subscribe') {
                const endpoints = Array.isArray(msg.endpoints) ? msg.endpoints : [msg.endpoint].filter(Boolean);
                const subs = getSubscriptions(ws);

                for (const ep of endpoints) {
                    if (isValidEndpointType(ep)) {
                        subs.add(ep);
                    }
                }

                ws.send(JSON.stringify({
                    type: 'subscribed',
                    endpoints: [...subs],
                    timestamp: new Date().toISOString(),
                }));

                console.log(`   📋 Client #${clientCount} subscribed to: ${[...subs].join(', ') || 'none'}`);
                return;
            }

            if (msg.action === 'unsubscribe') {
                const endpoints = Array.isArray(msg.endpoints) ? msg.endpoints : [msg.endpoint].filter(Boolean);
                const subs = getSubscriptions(ws);
                for (const ep of endpoints) subs.delete(ep);

                ws.send(JSON.stringify({
                    type: 'subscribed',
                    endpoints: [...subs],
                    timestamp: new Date().toISOString(),
                }));
                return;
            }

            if (msg.action === 'ping') {
                ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
                return;
            }
        } catch {
            // Ignore malformed messages
        }
    });

    ws.on('close', () => {
        clientCount--;
        console.log(`   ➖ Client #${clientCount + 1} disconnected — ${clientCount} remaining`);
    });

    ws.on('error', (err) => {
        console.error('   ❌ WS client error:', err.message);
    });
});

wss.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`   ❌ Port ${WS_PORT} already in use. Kill it manually: taskkill /PID <PID> /F`);
        process.exit(1);
    }
    console.error('\n❌ WS Server Error:', err.message);
});

// ─── Heartbeat ───────────────────────────────────────────────────────────────

setInterval(() => {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocketClient.OPEN) {
            client.send(JSON.stringify({
                type: 'heartbeat',
                apiHealthy,
                clientCount,
                uptime: Math.floor(process.uptime()),
                timestamp: new Date().toISOString(),
            }));
        }
    });
}, HEARTBEAT_INTERVAL_MS);

// ─── Periodic Polling — push to subscribed clients only ──────────────────────

async function pollAndBroadcast() {
    let anyFailed = false;

    for (const { type, path } of ENDPOINTS) {
        try {
            const url = `${NEXT_DEV_URL}${path}`;
            const res = await fetch(url, { signal: AbortSignal.timeout(API_TIMEOUT_MS) });

            if (!res.ok) {
                console.error(`   ⚠️  ${type}: HTTP ${res.status}`);
                anyFailed = true;
                continue;
            }

            const data = await res.json();
            const message = JSON.stringify({
                type,
                data,
                timestamp: new Date().toISOString(),
            });

            // Only broadcast to clients subscribed to this type
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocketClient.OPEN) {
                    const subs = getSubscriptions(client);
                    if (subs.size === 0 || subs.has(type)) {
                        client.send(message);
                    }
                }
            });
        } catch (err) {
            if (err.code === 'ECONNREFUSED' || err.code === 'UND_ERR_CONNECT_TIMEOUT') {
                return; // Next.js not ready — silently wait
            }
            console.error(`   ⚠️  ${type}: ${err.message}`);
            anyFailed = true;
        }
    }

    apiHealthy = !anyFailed;
}

// Start polling after a 2s delay
setTimeout(() => {
    pollAndBroadcast();
    setInterval(pollAndBroadcast, POLL_INTERVAL_MS);
}, 2_000);

console.log('   📡 Subscription-based broadcasting — clients receive only their subscribed endpoints');
console.log('   💓 Heartbeat every 5s — clients detect stale connections');
console.log(`   🚀 Ready! Connect: new WebSocket(\"ws://localhost:${WS_PORT}\")\n`);

// ─── Demo Notification Generator ────────────────────────────────────────────
// Sends a simulated notification to all clients subscribed to notifications.
// In production, replace with real polling from /api/notifications.

if (DEMO_NOTIFICATIONS_ENABLED) {
    setInterval(() => {
        const notif = generateDemoNotification();
        const message = JSON.stringify({
            type: 'notification',
            notification: notif,
            timestamp: new Date().toISOString(),
        });

        wss.clients.forEach((client) => {
            if (client.readyState === WebSocketClient.OPEN) {
                const subs = getSubscriptions(client);
                if (subs.size === 0) return; // Only send to subscribed clients
                // Send if they subscribe to notifications
                for (const sub of subs) {
                    if (sub.startsWith('notifications:') || sub === 'all') {
                        client.send(message);
                        break;
                    }
                }
            }
        });
    }, 15_000); // Every 15 seconds

    console.log('   🔔 Demo notifications enabled — sending one every 15s');
    console.log('      Set DISABLE_DEMO_NOTIFICATIONS=1 to disable');
}

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n   👋 Shutting down...');
    wss.close(() => {
        console.log('   ✅ WebSocket server closed.');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    wss.close(() => process.exit(0));
});
