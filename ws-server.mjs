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
 * 7. 📈 analytics:admin endpoint — real-time analytics payload (KPIs + charts)
 * 8. 👤 personal:user:{id} endpoint — per-user personal activity (orders,
 *    saved designs, wishlist updates, offers) pushed in real time
 *    → Replace generateDemoPersonalActivity() with real API polling in production
 * 9. 📦 order-status on personal:user:{id} — per-user live order transitions
 *    (Pending → Tailoring → Shipped → Delivered) pushed in real time
 *    → Replace generateDemoOrderStatus() with real API polling in production
 * 10. 💎 rewards on personal:user:{id} — per-user loyalty rewards (points,
 *     tier, leaderboard rank) pushed in real time. Fetches the real
 *     /api/dashboard/rewards route so the tier math lives in one place.
 * 11. 🏆 leaderboard:global — pushes live leaderboard updates (loyalty
 *     points / sales / designs rankings) to every client subscribed to the
 *     global channel whenever someone shops. Fetches the real
 *     /api/dashboard/leaderboard route per kind so ranking math stays in
 *     one place; tables update without a refresh.
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
    { type: 'analytics:admin', path: '/api/analytics' },
];

const VALID_ENDPOINT_TYPES = new Set(ENDPOINTS.map((e) => e.type));

// Allow dynamic notification & personal endpoints validation
function isValidEndpointType(type) {
    if (VALID_ENDPOINT_TYPES.has(type)) return true;
    // Dynamic notifications:user:{userId}
    if (type.startsWith('notifications:user:') || type === 'notifications:global') return true;
    // Dynamic personal activity: personal:user:{userId}
    if (type.startsWith('personal:user:')) return true;
    // Global leaderboard channel
    if (type === 'leaderboard:global') return true;
    // Global live ratings channel (new community reviews landing in real time)
    if (type === 'reviews:global') return true;
    // Admin/founder community overview channel
    if (type === 'community:admin') return true;
    // Designer portfolio channel
    if (type === 'designer:global') return true;
    // Sales partner referral overview channel
    if (type === 'sales-partner:global') return true;
    // Designer ↔ Company partnership hub
    if (type === 'connections:global') return true;
    return false;
}

// ─── Simulated Global Notifications (for demo / development) ─────────────────
// Broadcasts global events (new order received, atelier announcements) on
// the notifications:global channel to every client subscribed to it — the
// header NotificationBell and the notifications page both listen here.
// In production this would poll a real API endpoint (/api/notifications).
const DEMO_NOTIFICATIONS_ENABLED = !process.env.DISABLE_DEMO_NOTIFICATIONS;
let demoNotifCounter = 0;

function generateDemoGlobalNotification() {
    demoNotifCounter++;
    const templates = [
        { type: 'order', title: 'New Order Received', titleAr: 'تم استلام طلب جديد', message: 'Order #SADAF-' + (1000 + demoNotifCounter) + ' has been placed and is being prepared in the atelier.', messageAr: 'تم تقديم الطلب #SADAF-' + (1000 + demoNotifCounter) + ' بنجاح وهو قيد التجهيز في الأتيليه.' },
        { type: 'system', title: 'Atelier Announcement', titleAr: 'إعلان من الأتيليه', message: 'The new Autumn Heritage collection is now live across the atelier and gallery.', messageAr: 'مجموعة تراث الخريف الجديدة أصبحت متاحة الآن في الأتيليه والمعرض.' },
        { type: 'promotion', title: 'Limited Offer', titleAr: 'عرض محدود', message: 'Get 20% off on all Traditional Fusion pieces this weekend.', messageAr: 'احصل على خصم 20% على كل قطع الدمج التقليدي هذا الأسبوع.' },
        { type: 'review', title: 'New Review Posted', titleAr: 'تم نشر مراجعة جديدة', message: 'A customer left a 5-star review on one of our pieces.', messageAr: 'ترك أحد العملاء تقييمًا بخمس نجوم على إحدى قطعنا.' },
        { type: 'system', title: 'System Update', titleAr: 'تحديث النظام', message: 'SADAF platform v2.4.1 deployed with new features.', messageAr: 'تم نشر منصة SADAF v2.4.1 بميزات جديدة.' },
    ];
    const tpl = templates[demoNotifCounter % templates.length];
    return {
        id: 'demo-global-' + Date.now() + '-' + demoNotifCounter,
        type: tpl.type,
        title: tpl.title,
        titleAr: tpl.titleAr,
        message: tpl.message,
        messageAr: tpl.messageAr,
        createdAt: new Date().toISOString(),
        read: false,
        href: '/dashboard/notifications',
    };
}

/** True when at least one connected client subscribes to notifications:global. */
function hasGlobalNotificationSubscribers() {
    let found = false;
    wss.clients.forEach((client) => {
        if (client.readyState !== WebSocketClient.OPEN) return;
        if (getSubscriptions(client).has('notifications:global')) found = true;
    });
    return found;
}

/** Broadcast a global notification to every client subscribed to the channel. */
function sendGlobalNotification(notification) {
    const message = JSON.stringify({
        type: 'notifications:global',
        notification,
        timestamp: new Date().toISOString(),
    });
    wss.clients.forEach((client) => {
        if (client.readyState !== WebSocketClient.OPEN) return;
        if (getSubscriptions(client).has('notifications:global')) {
            client.send(message);
        }
    });
}

// ─── Simulated Friend Requests (for demo / development) ───────────────────────
// Pushes a simulated incoming connection request to each user subscribed to
// notifications:user:{userId} so the header FriendRequestsBadge counts it in
// real time (deduped by id on the client, so reconnects / fallback polling
// never inflate the badge).
// In production, replace with real events from the connections API.
const DEMO_FRIEND_REQUESTS_ENABLED = !process.env.DISABLE_DEMO_FRIEND_REQUESTS;
let friendRequestCounter = 0;

const FRIEND_REQUEST_SENDERS = [
    'Maya Hassan',
    'Youssef Farouk',
    'Hana Adel',
    'Tarek Nabil',
    'Salma Fouad',
    'Omar Khaled',
    'Rania Mostafa',
    'Ali Sherif',
    'Nour El-Din',
    'Farida Tamer',
];

function generateDemoFriendRequest() {
    const sender = FRIEND_REQUEST_SENDERS[friendRequestCounter % FRIEND_REQUEST_SENDERS.length];
    const relationship = friendRequestCounter % 2 === 0 ? 'friend' : 'family';
    friendRequestCounter++;
    return {
        id: 'fr-demo-' + Date.now() + '-' + friendRequestCounter,
        type: 'friend_request',
        relationship,
        senderEmail: sender.toLowerCase().replace(/\s+/g, '.') + '@example.com',
        title: 'New Friend Request',
        message: `${sender} sent you a ${relationship} request`,
        senderName: sender,
        createdAt: new Date().toISOString(),
        read: false,
        href: '/dashboard/community',
    };
}

/** Distinct user ids with at least one active notifications:user:{id} subscription. */
function collectNotifiedUserIds() {
    const userIds = new Set();
    wss.clients.forEach((client) => {
        if (client.readyState !== WebSocketClient.OPEN) return;
        const subs = getSubscriptions(client);
        for (const sub of subs) {
            if (sub.startsWith('notifications:user:')) {
                userIds.add(sub.slice('notifications:user:'.length));
            }
        }
    });
    return userIds;
}

/** Send a notification to every client subscribed to notifications:user:{userId}. */
function sendToUserNotificationChannel(userId, notification) {
    const message = JSON.stringify({
        type: `notifications:user:${userId}`,
        notification,
        timestamp: new Date().toISOString(),
    });
    wss.clients.forEach((client) => {
        if (client.readyState !== WebSocketClient.OPEN) return;
        if (getSubscriptions(client).has(`notifications:user:${userId}`)) {
            client.send(message);
        }
    });
}

// ─── Simulated Personal Activity (for demo / development) ────────────────────
// Pushes per-user personal activity (order placed, design saved) to clients
// subscribed to personal:user:{userId}.
// In production, replace with real events from the database (orders, designs).
const DEMO_PERSONAL_ACTIVITY_ENABLED = !process.env.DISABLE_DEMO_PERSONAL_ACTIVITY;
let personalActivityCounter = 0;

function generateDemoPersonalActivity(userId) {
    personalActivityCounter++;
    const templates = [
        { type: 'order', title: 'Order Placed', message: 'Order #SADAF-' + (5000 + personalActivityCounter) + ' has been placed and is being prepared in the atelier.' },
        { type: 'design', title: 'Design Saved', message: 'Your design "Heritage Fusion 07" was saved to your atelier.' },
        { type: 'wishlist', title: 'Wishlist Update', message: 'An item in your wishlist is now 15% off — limited time.' },
        { type: 'promotion', title: 'Personal Offer', message: 'You earned a 10% member discount on your next order.' },
    ];
    const tpl = templates[personalActivityCounter % templates.length];
    return {
        id: 'pa-demo-' + Date.now() + '-' + personalActivityCounter,
        type: tpl.type,
        title: tpl.title,
        message: tpl.message,
        timestamp: new Date().toISOString(),
        userId,
    };
}

// ─── Simulated Order Status (for demo / development) ─────────────────────────
// Pushes per-user live order transitions (Pending → Tailoring → Shipped →
// Delivered) to clients subscribed to personal:user:{userId}, using the
// `orderStatus` payload so it stays distinct from the `activity` payload.
// In production, replace with real polling from /api/dashboard/order-status.
const DEMO_ORDER_STATUS_ENABLED = !process.env.DISABLE_DEMO_ORDER_STATUS;
let orderStatusCounter = 0;

const ORDER_STATUS_FLOW = [
    { previousStatus: 'Pending', status: 'Tailoring', message: 'Your piece has entered the atelier — our artisans are sewing it by hand.' },
    { previousStatus: 'Tailoring', status: 'Shipped', message: 'Your order has shipped from the atelier and is on its way.' },
    { previousStatus: 'Shipped', status: 'Delivered', message: 'Delivered! We hope your piece brings you joy.' },
];

function generateDemoOrderStatus(userId) {
    const step = orderStatusCounter % ORDER_STATUS_FLOW.length;
    orderStatusCounter++;
    const transition = ORDER_STATUS_FLOW[step];
    return {
        id: 'os-demo-' + Date.now() + '-' + orderStatusCounter,
        orderId: 'SDF-2026-9041',
        previousStatus: transition.previousStatus,
        status: transition.status,
        message: transition.message,
        timestamp: new Date().toISOString(),
        userId,
    };
}

// ─── Real-time Rewards (for demo / development) ──────────────────────────────
// Pushes the logged-in user's loyalty rewards (points, tier, leaderboard
// rank) to clients subscribed to personal:user:{userId}, using the `rewards`
// payload (distinct from `activity` / `orderStatus`).
// It fetches the real /api/dashboard/rewards route so the tier math stays
// in exactly one place — in production this already reads the live API.
const DEMO_REWARDS_ENABLED = !process.env.DISABLE_DEMO_REWARDS;

// ─── Global Leaderboard (for demo / development) ─────────────────────────────
// Pushes live leaderboard updates to every client subscribed to the
// leaderboard:global channel. Fetches the real /api/dashboard/leaderboard
// route once per ranking kind so the ranking math lives in exactly one
// place — in production this already reads the live catalog.
const DEMO_LEADERBOARD_ENABLED = !process.env.DISABLE_DEMO_LEADERBOARD;
const LEADERBOARD_KINDS = ['points', 'sales', 'designs'];

/** True when at least one connected client subscribes to leaderboard:global. */
function hasLeaderboardSubscribers() {
    let found = false;
    wss.clients.forEach((client) => {
        if (client.readyState !== WebSocketClient.OPEN) return;
        if (getSubscriptions(client).has('leaderboard:global')) found = true;
    });
    return found;
}

/** Broadcast a leaderboard payload to every client subscribed to the global channel. */
function sendLeaderboardGlobal(kind, leaderboard) {
    const message = JSON.stringify({
        type: 'leaderboard:global',
        kind,
        leaderboard,
        timestamp: new Date().toISOString(),
    });
    wss.clients.forEach((client) => {
        if (client.readyState !== WebSocketClient.OPEN) return;
        if (getSubscriptions(client).has('leaderboard:global')) {
            client.send(message);
        }
    });
}

// ─── Community Overview (for demo / development) ────────────────────────────
// Pushes the platform-wide community overview (KPIs, top referrers, growth,
// pending requests) to every client subscribed to community:admin. Fetches
// the real /api/dashboard/community route so the aggregation math lives in
// exactly one place — in production this already reads the live catalog.
const DEMO_COMMUNITY_ADMIN_ENABLED = !process.env.DISABLE_DEMO_COMMUNITY_ADMIN;

/** True when at least one connected client subscribes to community:admin. */
function hasCommunityAdminSubscribers() {
    let found = false;
    wss.clients.forEach((client) => {
        if (client.readyState !== WebSocketClient.OPEN) return;
        if (getSubscriptions(client).has('community:admin')) found = true;
    });
    return found;
}

/** Broadcast the community overview to every client subscribed to the channel. */
function sendCommunityAdmin(data) {
    const message = JSON.stringify({
        type: 'community:admin',
        data,
        timestamp: new Date().toISOString(),
    });
    wss.clients.forEach((client) => {
        if (client.readyState !== WebSocketClient.OPEN) return;
        if (getSubscriptions(client).has('community:admin')) {
            client.send(message);
        }
    });
}

// ─── Designer Dashboard (for demo / development) ────────────────────────────
// Pushes the designer's portfolio (submissions + KPI stats) to every client
// subscribed to designer:global. Fetches the real /api/dashboard/designer
// route so the aggregation math lives in exactly one place.
const DEMO_DESIGNER_ENABLED = !process.env.DISABLE_DEMO_DESIGNER;

/** True when at least one connected client subscribes to designer:global. */
function hasDesignerSubscribers() {
    let found = false;
    wss.clients.forEach((client) => {
        if (client.readyState !== WebSocketClient.OPEN) return;
        if (getSubscriptions(client).has('designer:global')) found = true;
    });
    return found;
}

/** Broadcast the designer dashboard payload to every subscribed client. */
function sendDesignerGlobal(data) {
    const message = JSON.stringify({
        type: 'designer:global',
        data,
        timestamp: new Date().toISOString(),
    });
    wss.clients.forEach((client) => {
        if (client.readyState !== WebSocketClient.OPEN) return;
        if (getSubscriptions(client).has('designer:global')) {
            client.send(message);
        }
    });
}

// ─── Sales Partner Overview (for demo / development) ─────────────────────────
// Pushes the sales partner's referral overview (KPIs + referrals) to every
// client subscribed to sales-partner:global. Fetches the real
// /api/dashboard/sales-partner route so the commission math lives in one
// place.
const DEMO_SALES_PARTNER_ENABLED = !process.env.DISABLE_DEMO_SALES_PARTNER;

/** True when at least one connected client subscribes to sales-partner:global. */
function hasSalesPartnerSubscribers() {
    let found = false;
    wss.clients.forEach((client) => {
        if (client.readyState !== WebSocketClient.OPEN) return;
        if (getSubscriptions(client).has('sales-partner:global')) found = true;
    });
    return found;
}

/** Broadcast the sales partner overview to every subscribed client. */
function sendSalesPartnerGlobal(data) {
    const message = JSON.stringify({
        type: 'sales-partner:global',
        data,
        timestamp: new Date().toISOString(),
    });
    wss.clients.forEach((client) => {
        if (client.readyState !== WebSocketClient.OPEN) return;
        if (getSubscriptions(client).has('sales-partner:global')) {
            client.send(message);
        }
    });
}

// ─── Designer ↔ Company Connections Hub (for demo / development) ────────────
// Pushes the partnership hub payload (requests + designer/company directories)
// to every client subscribed to connections:global. Fetches the real
// /api/dashboard/connections route so both roles always see the same state.
const DEMO_CONNECTIONS_ENABLED = !process.env.DISABLE_DEMO_CONNECTIONS;

/** True when at least one connected client subscribes to connections:global. */
function hasConnectionsSubscribers() {
    let found = false;
    wss.clients.forEach((client) => {
        if (client.readyState !== WebSocketClient.OPEN) return;
        if (getSubscriptions(client).has('connections:global')) found = true;
    });
    return found;
}

/** Broadcast the connections payload to every subscribed client. */
function sendConnectionsGlobal(data) {
    const message = JSON.stringify({
        type: 'connections:global',
        data,
        timestamp: new Date().toISOString(),
    });
    wss.clients.forEach((client) => {
        if (client.readyState !== WebSocketClient.OPEN) return;
        if (getSubscriptions(client).has('connections:global')) {
            client.send(message);
        }
    });
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

/**
 * Collect the distinct user ids that currently have at least one active
 * `personal:user:{userId}` subscription across all connected clients.
 * Shared by the personal-activity, order-status and rewards broadcasters
 * so the channel format stays consistent in one place.
 */
function collectSubscribedUserIds() {
    const userIds = new Set();
    wss.clients.forEach((client) => {
        if (client.readyState !== WebSocketClient.OPEN) return;
        const subs = getSubscriptions(client);
        for (const sub of subs) {
            if (sub.startsWith('personal:user:')) {
                userIds.add(sub.slice('personal:user:'.length));
            }
        }
    });
    return userIds;
}

/**
 * Send a message to every client subscribed to the given personal channel.
 */
function sendToPersonalChannel(userId, payload) {
    const message = JSON.stringify({
        type: `personal:user:${userId}`,
        ...payload,
        timestamp: new Date().toISOString(),
    });

    wss.clients.forEach((client) => {
        if (client.readyState !== WebSocketClient.OPEN) return;
        const subs = getSubscriptions(client);
        if (subs.has(`personal:user:${userId}`)) {
            client.send(message);
        }
    });
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
        endpoints: [...ENDPOINTS.map((e) => e.type), 'notifications:user:{id}', 'notifications:global', 'personal:user:{id}', 'leaderboard:global', 'reviews:global', 'community:admin', 'designer:global', 'sales-partner:global', 'connections:global'],
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
console.log(`   🚀 Ready! Connect: new WebSocket(\\"ws://localhost:${WS_PORT}\\")`);

// ─── Demo Global Notification Generator ──────────────────────────────────────
// Sends a simulated global event (new order / announcement) to every client
// subscribed to notifications:global.
// In production, replace with real polling from /api/notifications.

if (DEMO_NOTIFICATIONS_ENABLED) {
    setInterval(() => {
        if (!hasGlobalNotificationSubscribers()) return;
        sendGlobalNotification(generateDemoGlobalNotification());
    }, 15_000); // Every 15 seconds

    console.log('   🔔 Demo global notifications enabled — sending one every 15s');
    console.log('      Set DISABLE_DEMO_NOTIFICATIONS=1 to disable');
}

// ─── Demo Friend Request Generator ───────────────────────────────────────────
// Sends a simulated incoming friend request to each user subscribed to
// notifications:user:{userId} — the header FriendRequestsBadge counts these
// in real time. Dedupe lives on the client (by notification id).
// In production, replace with real polling from the connections API.

if (DEMO_FRIEND_REQUESTS_ENABLED) {
    setInterval(() => {
        for (const userId of collectNotifiedUserIds()) {
            sendToUserNotificationChannel(userId, generateDemoFriendRequest());
        }
    }, 25_000); // Every 25 seconds

    console.log('   👥 Demo friend requests enabled — per-user push every 25s');
    console.log('      Set DISABLE_DEMO_FRIEND_REQUESTS=1 to disable');
}

// ─── Community Overview Generator ───────────────────────────────────────────
// Pushes the live platform community overview to every client subscribed to
// community:admin. Fetches the real /api/dashboard/community route.

if (DEMO_COMMUNITY_ADMIN_ENABLED) {
    setInterval(async () => {
        if (!hasCommunityAdminSubscribers()) return;

        try {
            const url = `${NEXT_DEV_URL}/api/dashboard/community`;
            const res = await fetch(url, { signal: AbortSignal.timeout(API_TIMEOUT_MS) });
            if (!res.ok) return;

            const data = await res.json();
            sendCommunityAdmin(data);
        } catch (err) {
            if (err.code === 'ECONNREFUSED' || err.code === 'UND_ERR_CONNECT_TIMEOUT') {
                return; // Next.js not ready — skip this tick
            }
            console.error(`   ⚠️ community:admin: ${err.message}`);
        }
    }, 10_000); // Every 10 seconds

    console.log('   👥 Real-time community overview enabled — global push every 10s');
    console.log('      Set DISABLE_DEMO_COMMUNITY_ADMIN=1 to disable');
}

// ─── Designer Dashboard Generator ───────────────────────────────────────────
// Pushes the live designer portfolio (submissions + stats) to every client
// subscribed to designer:global. Fetches the real /api/dashboard/designer
// route so the aggregation math lives in exactly one place.

if (DEMO_DESIGNER_ENABLED) {
    setInterval(async () => {
        if (!hasDesignerSubscribers()) return;

        try {
            const url = `${NEXT_DEV_URL}/api/dashboard/designer`;
            const res = await fetch(url, { signal: AbortSignal.timeout(API_TIMEOUT_MS) });
            if (!res.ok) return;

            const data = await res.json();
            sendDesignerGlobal(data);
        } catch (err) {
            if (err.code === 'ECONNREFUSED' || err.code === 'UND_ERR_CONNECT_TIMEOUT') {
                return; // Next.js not ready — skip this tick
            }
            console.error(`   ⚠️ designer:global: ${err.message}`);
        }
    }, 10_000); // Every 10 seconds

    console.log('   🎨 Real-time designer dashboard enabled — global push every 10s');
    console.log('      Set DISABLE_DEMO_DESIGNER=1 to disable');
}

// ─── Atelier Team Decision Generator ─────────────────────────────────────────
// Pushes real atelier decisions (approve / reject / start production) to
// every team member — the owner and each collaborator — via their
// notifications:user:{id} channel. Polls /api/dashboard/designer/events
// with a `since` cursor so each decision is delivered exactly once; the
// same events are merged into /api/notifications for the REST fallback.

const DEMO_ATELIER_EVENTS_ENABLED = !process.env.DISABLE_DEMO_ATELIER_EVENTS;
let lastAtelierEventCursor = 0;

/** Human-readable copy per event (mirrors the API route). */
function atelierEventTitle(status, kind) {
    if (kind === 'collaborator_added') return 'Added as a collaborator';
    switch (status) {
        case 'approved': return 'Design approved by the atelier';
        case 'rejected': return 'Design rejected by the atelier';
        case 'in_production': return 'Design entered production';
        case 'under_review': return 'Design is under review';
        default: return 'Atelier decision';
    }
}

function atelierEventMessage(event) {
    if (event.kind === 'collaborator_added') {
        return `You were added as a collaborator to “${event.title}” — role: ${event.collaboratorRole || 'Collaborator'}.`;
    }
    const base = `“${event.title}”`;
    switch (event.status) {
        case 'approved': return `${base} was approved — the atelier begins sampling.`;
        case 'rejected':
            return event.adminNote
                ? `${base} was rejected. Atelier note: “${event.adminNote}”`
                : `${base} was rejected — check the atelier feedback.`;
        case 'in_production': return `${base} is now in production in the atelier.`;
        case 'under_review': return `${base} is being reviewed by the atelier.`;
        default: return `The atelier updated “${event.title}”.`;
    }
}

if (DEMO_ATELIER_EVENTS_ENABLED) {
    setInterval(async () => {
        try {
            const url = `${NEXT_DEV_URL}/api/dashboard/designer/events?since=${lastAtelierEventCursor}`;
            const res = await fetch(url, { signal: AbortSignal.timeout(API_TIMEOUT_MS) });
            if (!res.ok) return;

            const { events } = await res.json();
            if (!Array.isArray(events) || events.length === 0) return;

            // Track the cursor first so a crash mid-loop never re-sends.
            lastAtelierEventCursor = Math.max(
                lastAtelierEventCursor,
                ...events.map((e) => e.id),
            );

            for (const event of events) {
                const notification = {
                    id: `atelier-event-${event.id}`,
                    type: 'system',
                    title: atelierEventTitle(event.status, event.kind),
                    message: atelierEventMessage(event),
                    href: `/dashboard/designer/portfolio/${event.submissionId}`,
                    createdAt: event.createdAt,
                    read: false,
                };
                for (const recipientId of event.recipientIds) {
                    sendToUserNotificationChannel(recipientId, notification);
                }
            }
        } catch (err) {
            if (err.code === 'ECONNREFUSED' || err.code === 'UND_ERR_CONNECT_TIMEOUT') {
                return; // Next.js not ready — skip this tick
            }
            console.error(`   ⚠️ atelier-events: ${err.message}`);
        }
    }, 3_000); // Every 3 seconds — same cadence as the designer payload poll

    console.log('   📣 Real-time atelier decisions enabled — team push every 3s');
    console.log('      Set DISABLE_DEMO_ATELIER_EVENTS=1 to disable');
}

// ─── Sales Partner Overview Generator ───────────────────────────────────────
// Pushes the live sales partner referral overview to every client
// subscribed to sales-partner:global. Fetches the real
// /api/dashboard/sales-partner route so the commission math lives in one
// place.

if (DEMO_SALES_PARTNER_ENABLED) {
    setInterval(async () => {
        if (!hasSalesPartnerSubscribers()) return;

        try {
            const url = `${NEXT_DEV_URL}/api/dashboard/sales-partner`;
            const res = await fetch(url, { signal: AbortSignal.timeout(API_TIMEOUT_MS) });
            if (!res.ok) return;

            const data = await res.json();
            sendSalesPartnerGlobal(data);
        } catch (err) {
            if (err.code === 'ECONNREFUSED' || err.code === 'UND_ERR_CONNECT_TIMEOUT') {
                return; // Next.js not ready — skip this tick
            }
            console.error(`   ⚠️ sales-partner:global: ${err.message}`);
        }
    }, 5_000); // Every 5 seconds — snappy enough that a referral conversion
    // toast (pending → converted) appears almost immediately on the dashboard.

    console.log('   🤝 Real-time sales partner dashboard enabled — global push every 5s');
    console.log('      Set DISABLE_DEMO_SALES_PARTNER=1 to disable');
}

if (DEMO_CONNECTIONS_ENABLED) {
    setInterval(async () => {
        if (!hasConnectionsSubscribers()) return;

        try {
            const url = `${NEXT_DEV_URL}/api/dashboard/connections`;
            const res = await fetch(url, { signal: AbortSignal.timeout(API_TIMEOUT_MS) });
            if (!res.ok) return;

            const data = await res.json();
            sendConnectionsGlobal(data);
        } catch (err) {
            if (err.code === 'ECONNREFUSED' || err.code === 'UND_ERR_CONNECT_TIMEOUT') {
                return; // Next.js not ready — skip this tick
            }
            console.error(`   ⚠️ connections:global: ${err.message}`);
        }
    }, 10_000); // Every 10 seconds

    console.log('   🤝 Real-time designer-company connections hub enabled — global push every 10s');
    console.log('      Set DISABLE_DEMO_CONNECTIONS=1 to disable');
}

// ─── Demo Personal Activity Generator ───────────────────────────────────────
// Sends a simulated per-user personal event (order placed / design saved) to
// clients subscribed to personal:user:{userId}.
// In production, replace with real polling from /api/dashboard/personal-activity.

if (DEMO_PERSONAL_ACTIVITY_ENABLED) {
    setInterval(() => {
        for (const userId of collectSubscribedUserIds()) {
            const activity = generateDemoPersonalActivity(userId);
            sendToPersonalChannel(userId, { activity });
        }
    }, 15_000); // Every 15 seconds

    console.log('   👤 Demo personal activity enabled — per-user push every 15s');
    console.log('      Set DISABLE_DEMO_PERSONAL_ACTIVITY=1 to disable');
}

// ─── Demo Order Status Generator ────────────────────────────────────────────
// Sends a simulated per-user order transition (Pending → Tailoring → Shipped
// → Delivered) to clients subscribed to personal:user:{userId}, using the
// `orderStatus` payload (distinct from `activity`).
// In production, replace with real polling from /api/dashboard/order-status.

if (DEMO_ORDER_STATUS_ENABLED) {
    setInterval(() => {
        for (const userId of collectSubscribedUserIds()) {
            const orderStatus = generateDemoOrderStatus(userId);
            sendToPersonalChannel(userId, { orderStatus });
        }
    }, 12_000); // Every 12 seconds

    console.log('   📦 Demo order status enabled — per-user transition every 12s');
    console.log('      Set DISABLE_DEMO_ORDER_STATUS=1 to disable');
}

// ─── Real-time Rewards Generator ────────────────────────────────────────────
// Sends the logged-in user's loyalty rewards (points, tier, leaderboard rank)
// to clients subscribed to personal:user:{userId}, using the `rewards`
// payload (distinct from `activity` / `orderStatus`). It fetches the real
// /api/dashboard/rewards route so tier math stays in one place.

if (DEMO_REWARDS_ENABLED) {
    setInterval(async () => {
        for (const userId of collectSubscribedUserIds()) {
            try {
                const url = `${NEXT_DEV_URL}/api/dashboard/rewards?userId=${encodeURIComponent(userId)}`;
                const res = await fetch(url, { signal: AbortSignal.timeout(API_TIMEOUT_MS) });
                if (!res.ok) continue;

                const rewards = await res.json();
                sendToPersonalChannel(userId, { rewards });
            } catch (err) {
                if (err.code === 'ECONNREFUSED' || err.code === 'UND_ERR_CONNECT_TIMEOUT') {
                    continue; // Next.js not ready — skip this user, keep others
                }
                console.error(`   ⚠️ rewards:${userId}: ${err.message}`);
            }
        }
    }, 12_000); // Every 12 seconds

    console.log('   💎 Real-time rewards enabled — per-user push every 12s');
    console.log('      Set DISABLE_DEMO_REWARDS=1 to disable');
}

// ─── Global Leaderboard Generator ───────────────────────────────────────────
// Pushes live leaderboard updates to every client subscribed to
// leaderboard:global, once per ranking kind. Fetches the real
// /api/dashboard/leaderboard route so ranking math stays in one place.
// In production this already reads the live catalog — clients (useLeaderboard)
// re-rank instantly when someone shops.

if (DEMO_LEADERBOARD_ENABLED) {
    setInterval(async () => {
        if (!hasLeaderboardSubscribers()) return;

        for (const kind of LEADERBOARD_KINDS) {
            try {
                const url = `${NEXT_DEV_URL}/api/dashboard/leaderboard?kind=${encodeURIComponent(kind)}&size=100`;
                const res = await fetch(url, { signal: AbortSignal.timeout(API_TIMEOUT_MS) });
                if (!res.ok) continue;

                const leaderboard = await res.json();
                sendLeaderboardGlobal(kind, leaderboard);
            } catch (err) {
                if (err.code === 'ECONNREFUSED' || err.code === 'UND_ERR_CONNECT_TIMEOUT') {
                    continue; // Next.js not ready — skip this tick, keep others
                }
                console.error(`   ⚠️ leaderboard:${kind}: ${err.message}`);
            }
        }
    }, 12_000); // Every 12 seconds

    console.log('   🏆 Real-time leaderboard enabled — global push every 12s');
    console.log('      Set DISABLE_DEMO_LEADERBOARD=1 to disable');
}

// ─── Live Ratings (reviews:global) ──────────────────────────────────────────
// Pushes "a community review just landed" events to every client subscribed
// to the reviews:global channel, mirroring the leaderboard:global pattern.
// The client merges each live review into its aggregated rating (average +
// count + latest-reviews list) so scores move in real time.
// → Replace generateDemoReview() with real API polling in production.
const DEMO_REVIEWS_ENABLED = !process.env.DISABLE_DEMO_REVIEWS;

/** Catalog products the demo review pool can target (id + display name). */
const REVIEW_PRODUCTS = [
    { id: 'f-1', name: 'Empress Diwani Abaya Cape' },
    { id: 'f-2', name: 'Sadaf Inlaid Peak Tuxedo' },
    { id: 'f-3', name: 'Fatimid Star Silk Slip Dress' },
    { id: 'f-4', name: 'Gilded Caliph Streetwear Hoodie' },
    { id: 'f-5', name: 'Royal Heir Linen Set' },
];

/** Community review templates cycled by the demo pusher. */
const REVIEW_TEMPLATES = [
    { userName: 'Yara H.', rating: 5, title: 'Even more stunning in person', comment: 'The details are unreal — the embroidery catches the light beautifully. I get stopped everywhere.' },
    { userName: 'Omar S.', rating: 4, title: 'Beautiful craftsmanship', comment: 'Incredible quality and finish. The fit runs slightly large but the fabric is worth every penny.' },
    { userName: 'Nadine K.', rating: 5, title: 'Worth the investment', comment: 'Felt like royalty at the event. The stitching is museum-grade and it arrived beautifully packaged.' },
    { userName: 'Tarek M.', rating: 3, title: 'Lovely piece, delicate fabric', comment: 'Gorgeous design — just be careful with the fabric, it needs professional care only.' },
    { userName: 'Lina W.', rating: 4, title: 'Elegant and unique', comment: 'Nothing else like it in my closet. The gold accents are subtle yet striking.' },
    { userName: 'Salma F.', rating: 5, title: 'A masterpiece', comment: 'The craftsmanship is beyond anything I have seen locally. Highly recommend for special occasions.' },
];

let liveReviewSeq = 0;

/** True when at least one connected client subscribes to reviews:global. */
function hasReviewsSubscribers() {
    let found = false;
    wss.clients.forEach((client) => {
        if (client.readyState !== WebSocketClient.OPEN) return;
        if (getSubscriptions(client).has('reviews:global')) found = true;
    });
    return found;
}

/** Broadcast a live review event to every client subscribed to the global channel. */
function sendReviewsGlobal(review) {
    const message = JSON.stringify({
        type: 'reviews:global',
        review,
        timestamp: new Date().toISOString(),
    });
    wss.clients.forEach((client) => {
        if (client.readyState !== WebSocketClient.OPEN) return;
        if (getSubscriptions(client).has('reviews:global')) {
            client.send(message);
        }
    });
}

if (DEMO_REVIEWS_ENABLED) {
    setInterval(() => {
        if (!hasReviewsSubscribers()) return;

        const product = REVIEW_PRODUCTS[Math.floor(Math.random() * REVIEW_PRODUCTS.length)];
        const template = REVIEW_TEMPLATES[Math.floor(Math.random() * REVIEW_TEMPLATES.length)];
        liveReviewSeq += 1;

        sendReviewsGlobal({
            id: `live-rev-${Date.now()}-${liveReviewSeq}`,
            productId: product.id,
            productName: product.name,
            userName: template.userName,
            rating: template.rating,
            title: template.title,
            comment: template.comment,
            createdAt: new Date().toISOString(),
            verified: true,
            isLive: true,
        });
    }, 18_000); // Every 18 seconds

    console.log('   ⭐ Real-time ratings enabled — global review push every 18s');
    console.log('      Set DISABLE_DEMO_REVIEWS=1 to disable');
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
