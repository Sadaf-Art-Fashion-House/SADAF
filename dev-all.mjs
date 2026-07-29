#!/usr/bin/env node

/**
 * SADAF | Dev All — Start Next.js + WebSocket Server
 *
 * Kills any stale processes on ports 3000 and 3001,
 * then starts both servers in separate terminal windows.
 *
 * Usage: node dev-all.mjs
 */

import { execSync } from 'child_process';
import { platform } from 'os';

function findPidsOnPort(port) {
    try {
        const cmd = platform() === 'win32'
            ? `netstat -ano | findstr ":${port} " | findstr "LISTENING"`
            : `lsof -ti:${port}`;
        const out = execSync(cmd, { encoding: 'utf8', timeout: 3000 });
        if (!out.trim()) return [];
        const rawPids = platform() === 'win32'
            ? out.trim().split('\n').map(line => parseInt(line.trim().split(/\s+/).pop()))
            : out.trim().split('\n').map(pid => parseInt(pid));
        return [...new Set(rawPids.filter(Boolean))];
    } catch {
        return [];
    }
}

function killPid(pid) {
    try {
        execSync(platform() === 'win32' ? `taskkill /F /PID ${pid}` : `kill -9 ${pid}`, {
            stdio: 'ignore',
            timeout: 2000,
        });
        console.log(`   ✅ Killed stale process PID ${pid}`);
    } catch {
        // Process might already be dead
    }
}

console.log('');
console.log('🚀 SADAF — Starting Development Servers');
console.log('');

// Release both ports
for (const port of [3000, 3001]) {
    const pids = findPidsOnPort(port);
    if (pids.length > 0) {
        console.log(`   ⚠️  Port ${port} in use by PID(s): ${pids.join(', ')}`);
        pids.forEach(killPid);
    } else {
        console.log(`   ✅ Port ${port} free`);
    }
}

// Small delay to let OS release the ports
await new Promise(r => setTimeout(r, 1500));

// Start both servers
const isWin = platform() === 'win32';

if (isWin) {
    execSync('start "SADAF-WS" node ws-server.mjs', { stdio: 'ignore' });
    execSync('start "SADAF-Next" npx next dev -p 3000', { stdio: 'ignore' });
} else {
    execSync('node ws-server.mjs &', { stdio: 'inherit' });
    execSync('npx next dev -p 3000', { stdio: 'inherit' });
}

console.log('');
console.log('   📡 WebSocket Server → ws://localhost:3001');
console.log('   🌐 Next.js           → http://localhost:3000');
console.log('');
console.log('   Close the terminal windows to stop the servers.');
console.log('');
