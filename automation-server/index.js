
import express from 'express';
import cors from 'cors';
import { chromium } from 'playwright';

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Global Error Handlers to prevent server crash
process.on('uncaughtException', (err) => {
    console.error('!!! UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('!!! UNHANDLED REJECTION:', reason);
});

app.post('/run', async (req, res) => {
    const { steps } = req.body;
    console.log(`[${new Date().toLocaleTimeString()}] >>> New Request: ${steps?.length || 0} steps`);

    if (!steps || !Array.isArray(steps)) {
        return res.status(400).json({ error: 'Invalid steps format' });
    }

    let browser;
    let context;
    let page;
    const logs = [];

    try {
        console.log('Launching Headed Browser...');
        browser = await chromium.launch({
            headless: false,
            slowMo: 150
        });
        context = await browser.newContext({
            viewport: { width: 1280, height: 720 }
        });
        page = await context.newPage();

        for (const [index, step] of steps.entries()) {
            const logPrefix = `Step ${index + 1} [${step.type}]`;
            logs.push(`${logPrefix} Started`);

            if (index === 0 && step.url) {
                await page.goto(step.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
            }

            // User requested to remove explicit delay and rely on auto-wait
            // if (step.delay) await page.waitForTimeout(step.delay);

            try {
                if (step.type === 'CLICK') {
                    if (step.xpath) await page.locator(`xpath=${step.xpath}`).click({ timeout: 8000 });
                    else if (step.id) await page.locator(`#${step.id}`).click({ timeout: 8000 });
                    else if (step.className) {
                        const selector = step.className.trim().split(/\s+/).join('.');
                        await page.locator(`.${selector}`).first().click({ timeout: 8000 });
                    }
                    else if (step.text && step.tagName) {
                        const cleanText = step.text.replace(/\n/g, ' ').trim();
                        await page.locator(`${step.tagName.toLowerCase()}:has-text("${cleanText}")`).first().click({ timeout: 8000 });
                    }
                }
                else if (step.type === 'INPUT') {
                    const val = step.value || '';
                    if (step.xpath) await page.locator(`xpath=${step.xpath}`).fill(val, { timeout: 8000 });
                    else if (step.id) await page.locator(`#${step.id}`).fill(val, { timeout: 8000 });
                    else if (step.name) await page.locator(`[name="${step.name}"]`).fill(val, { timeout: 8000 });
                    else if (step.placeholder) await page.locator(`[placeholder="${step.placeholder}"]`).fill(val, { timeout: 8000 });
                }
                logs.push(`${logPrefix} Success`);
                console.log(`${logPrefix} Success`);
            } catch (actionError) {
                throw new Error(`Execution failed at ${logPrefix}: ${actionError.message.split('\n')[0]}`);
            }
        }

        console.log('Automation completed.');
        if (!res.headersSent) res.json({ status: 'success', logs });

    } catch (error) {
        console.error('Automation Error:', error.message);
        if (!res.headersSent) res.status(500).json({ status: 'error', message: error.message, logs });
    } finally {
        // CRITICAL: Wrap cleanup in try-catch so it doesn't crash the server if user closed browser
        try {
            if (page && !page.isClosed()) await page.waitForTimeout(2000).catch(() => { });
            if (browser) await browser.close().catch(() => { });
            console.log('Browser cleaned up successfully.');
        } catch (cleanupError) {
            console.log('Browser was already closed or cleanup failed - Server remains alive.');
        }
    }
});

app.listen(PORT, () => {
    console.log(`Automation Compass Server running on http://localhost:${PORT}`);
    console.log(`Ready to launch REAL browsers!`);
});
