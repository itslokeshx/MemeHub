import cron from 'node-cron';
import https from 'https';

/**
 * Keep-Alive Service
 * Prevents Render from putting the server to sleep by pinging itself every 14 minutes
 */

const RENDER_URL = process.env.RENDER_URL || 'https://memehub-m4gy.onrender.com';
const PING_INTERVAL = '*/14 * * * *'; // Every 14 minutes

export function startKeepAlive() {
    // Only run in production on Render
    if (process.env.NODE_ENV !== 'production' || !process.env.RENDER) {
        console.log('[Keep-Alive] Disabled in development');
        return;
    }

    console.log('[Keep-Alive] Starting cron job...');

    cron.schedule(PING_INTERVAL, () => {
        const url = `${RENDER_URL}/api/memes?limit=1`;

        https.get(url, (res) => {
            if (res.statusCode === 200) {
                console.log(`[Keep-Alive] ✓ Ping successful at ${new Date().toISOString()}`);
            } else {
                console.log(`[Keep-Alive] ⚠ Ping returned status ${res.statusCode}`);
            }
        }).on('error', (err) => {
            console.error('[Keep-Alive] ✗ Ping failed:', err.message);
        });
    });

    console.log('[Keep-Alive] Cron job scheduled (every 14 minutes)');
}
