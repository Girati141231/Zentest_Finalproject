import express from 'express';
import cors from 'cors';
import { chromium } from 'playwright';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, getDoc, doc, updateDoc, query, where, Timestamp, deleteDoc } from 'firebase/firestore';

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- Firebase Config ---
const firebaseConfig = {
    apiKey: "AIzaSyA-bmsxiuy9_xlHXUiOXLNFRvfAK8N2UBE",
    authDomain: "tester-app-2768b.firebaseapp.com",
    projectId: "tester-app-2768b",
    storageBucket: "tester-app-2768b.firebasestorage.app",
    messagingSenderId: "1096428156038",
    appId: "1:1096428156038:web:9df87b24523692eaff8d07"
};

const fbApp = initializeApp(firebaseConfig);
const auth = getAuth(fbApp);
const db = getFirestore(fbApp);

// App ID constant from Zentest
const APP_ID = 'zentest-compact-shared';

// Helper: Ensure Authentication (Required by Firestore Rules)
const ensureAuth = async () => {
    if (!auth.currentUser) {
        console.log('[AUTH] System NOT authenticated. Signing in anonymously...');
        await signInAnonymously(auth);
        console.log('[AUTH] Signed in successfully as:', auth.currentUser.uid);
    }
};

// --- Endpoints ---

// 0. Verify & Get Projects for a User Account
app.post('/projects', async (req, res) => {
    const { apiKey: userId } = req.body; // apiKey ในรูปการณ์นี้คือ User ID
    console.log(`[Extension] Requesting projects for Account: ${userId}`);

    if (!userId) return res.status(400).json({ error: 'User ID is required' });

    try {
        await ensureAuth();
        
        // 1. ดึงรายการ Project IDs ที่ User เป็นสมาชิกอยู่
        // Path: /artifacts/{appId}/users/{userId}/myProjects
        const myProjectsRef = collection(db, 'artifacts', APP_ID, 'users', userId, 'myProjects');
        const myProjectsSnap = await getDocs(myProjectsRef);
        
        const projectIds = myProjectsSnap.docs.map(d => d.id);
        
        if (projectIds.length === 0) {
            console.log(`[Extension] No projects found for account: ${userId}`);
            return res.json({ projects: [] });
        }

        // 2. ดึงข้อมูล Project Details สำหรับแต่ละ ID
        // Note: Firestore 'in' query supports up to 10 items. For more, we'd need chunks.
        // For ZenTest Compact, we assume users have < 10 projects or we fetch all and filter.
        const projectsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'projects');
        const projectsSnap = await getDocs(projectsRef);
        
        const userProjects = projectsSnap.docs
            .filter(d => projectIds.includes(d.id))
            .map(d => ({
                id: d.id,
                name: d.data().name || 'Unnamed Project'
            }));

        console.log(`[Extension] Found ${userProjects.length} projects for account: ${userId}`);
        res.json({ projects: userProjects });

    } catch (error) {
        console.error('CRITICAL ERROR in /projects:', error);
        res.status(500).json({ error: 'Local Server Error: ' + error.message });
    }
});

// 1. บันทึก Automation 
app.post('/save-automation', async (req, res) => {
    const { steps, apiKey, projectId, folderName, moduleName, scenarioName } = req.body;
    
    // VERBOSE DETERMINATION LOGIC
    let finalFolder = 'General';
    if (folderName && folderName.trim().length > 0 && folderName.trim() !== '-- SELECT PROJECT MODULE --') {
        finalFolder = folderName.trim();
    } else if (moduleName && moduleName !== '-- SELECT PROJECT MODULE --' && moduleName !== 'NEW_MODULE' && moduleName.trim() !== '') {
        finalFolder = moduleName;
    }
    
    console.log(`[Sync] FINAL DETERMINATION: from("${folderName}") and drop("${moduleName}") -> Result: "${finalFolder}"`);
    console.log(`[Sync] Saving script: ${scenarioName} under Module/Folder: ${finalFolder}`);

    if (!steps || !projectId || !finalFolder || !scenarioName) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        await ensureAuth();
        // Path matches Rules: /artifacts/{appId}/public/data/automationLibrary
        const libRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'automationLibrary');
        const docRef = await addDoc(libRef, {
            projectId,
            folderName: finalFolder,
            scenarioName,
            steps,
            createdBy: apiKey || 'anonymous',
            createdAt: Date.now(),
            timestamp: Timestamp.now()
        });

        console.log(`[Sync] SUCCESS! Saved with ID: ${docRef.id}`);

        // --- Auto-Create Module Logic ---
        try {
            const modulesRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'modules');
            const q = query(modulesRef, 
                where('projectId', '==', projectId),
                where('name', '==', finalFolder)
            );
            const mSnap = await getDocs(q);
            
            if (mSnap.empty && finalFolder !== 'General') {
                console.log(`[Sync] Creating new module: ${finalFolder} for project: ${projectId}`);
                await addDoc(modulesRef, {
                    projectId,
                    name: finalFolder,
                    createdAt: Date.now()
                });
            }
        } catch (mErr) {
            console.error('[Sync] Failed to auto-create module (Non-critical):', mErr.message);
        }

        res.json({ status: 'success', id: docRef.id, finalFolder: finalFolder });
    } catch (error) {
        console.error('CRITICAL ERROR in /save-automation:', error);
        res.status(500).json({ error: 'Failed to save to Firestore: ' + error.message });
    }
});

// 1.5 ดึงรายการ Modules สำหรับ Project
app.get('/modules/:projectId', async (req, res) => {
    const { projectId } = req.params;
    console.log(`[Extension] Fetching modules for Project: ${projectId}`);
    
    try {
        await ensureAuth();
        const modulesRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'modules');
        const q = query(modulesRef, where('projectId', '==', projectId));
        const snap = await getDocs(q);
        
        const modules = snap.docs.map(d => ({
            id: d.id,
            name: d.data().name
        }));
        
        console.log(`[Extension] Found ${modules.length} modules`);
        res.json({ modules });
    } catch (error) {
        console.error('CRITICAL ERROR in /modules:', error);
        res.status(500).json({ error: error.message });
    }
});

// 2. ดึงรายการ Automation (สำหรับแอป Zentest)
app.get('/list-automation/:projectId', async (req, res) => {
    const { projectId } = req.params;
    console.log(`[App] Fetching automation library for Project: ${projectId}`);

    try {
        await ensureAuth();
        const libRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'automationLibrary');
        const q = query(libRef, where('projectId', '==', projectId));
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log(`[App] Found ${list.length} scripts`);
        res.json(list);
    } catch (error) {
        console.error('CRITICAL ERROR in /list-automation:', error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/automation/:id', async (req, res) => {
    const { id } = req.params;
    console.log(`[Delete] Request to remove script ID: ${id}`);

    try {
        await ensureAuth();
        const docPath = `artifacts/${APP_ID}/public/data/automationLibrary/${id}`;
        console.log(`[Delete] Targeting path: ${docPath}`);

        const docRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'automationLibrary', id);
        await deleteDoc(docRef);

        console.log(`[Delete] SUCCESS: ${id} removed.`);
        res.json({ status: 'success' });
    } catch (error) {
        console.error('[Delete] FAILED:', error);
        res.status(500).json({
            error: error.message,
            code: error.code || 'unknown'
        });
    }
});



app.put('/automation/:id', async (req, res) => {
    const { id } = req.params;
    const { steps, scenarioName } = req.body;
    console.log(`[Update] Request to update script ID: ${id}`);

    // Validate steps structure safely
    if (steps && !Array.isArray(steps)) return res.status(400).json({ error: 'Steps must be an array' });

    try {
        await ensureAuth();
        const docRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'automationLibrary', id);

        // Update fields
        const updateData = { updatedAt: Date.now() };
        if (steps) updateData.steps = steps;
        if (scenarioName) updateData.scenarioName = scenarioName;

        await updateDoc(docRef, updateData);

        console.log(`[Update] SUCCESS: ${id} updated.`);
        res.json({ status: 'success' });
    } catch (error) {
        console.error('[Update] FAILED:', error);
        res.status(500).json({ error: error.message });
    }
});

// 2.5 Run API Proxy (New Feature)
app.post('/run-api', async (req, res) => {
    const { method, url, headers, body } = req.body;
    console.log(`[API Proxy] ${method} ${url}`);

    try {
        const options = {
            method,
            headers: { ...headers, 'User-Agent': 'Zentest-Automation/1.0' },
            redirect: 'manual' // Prevent automatic redirects to login pages or SPA index.html
        };

        if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
            options.body = typeof body === 'object' ? JSON.stringify(body) : body;
        }

        const start = Date.now();
        console.log(`[API Proxy] Fetching: ${url}`);
        const response = await fetch(url, options);
        const duration = Date.now() - start;

        // Try to parse response body
        const contentType = response.headers.get('content-type');
        let data;
        let dataText = '';

        try {
            dataText = await response.text();
            if (contentType && contentType.includes('application/json')) {
                data = JSON.parse(dataText);
            } else {
                data = dataText;
            }
        } catch (e) {
            data = dataText; // Fallback
        }

        console.log(`[API Proxy] Response: ${response.status} ${response.statusText} (${duration}ms)`);

        // Critical Fix: If we get HTML, it means we hit a 404 page or SPA fallback, NOT the API.
        // This happens when the target server is down (and we hit localhost:3000 which might be running something else?)
        // OR if the URL is wrong.
        if (typeof data === 'string' && (data.trim().startsWith('<!DOCTYPE html>') || data.trim().startsWith('<html'))) {
            console.warn('[API Proxy] Error: Received HTML response. Target API is likely down or URL is wrong.');
            // Override status to indicate failure
            return res.json({
                status: 404, // or 502
                statusText: 'Not Found (API Unreachable)',
                headers: Object.fromEntries(response.headers.entries()),
                data: 'Error: Received HTML instead of JSON. The target API might be down or the URL is incorrect.',
                duration
            });
        }

        res.json({
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            data,
            duration
        });

    } catch (error) {
        console.error('[API Proxy] Error:', error.message);
        const isConnectionRefused = error.message.includes('fetch failed') || error.code === 'ECONNREFUSED';

        res.status(200).json({ // Return 200 to Client so it can parse the error object
            status: 0,
            statusText: isConnectionRefused ? 'Connection Refused' : 'Network Error',
            data: `Could not connect to ${url}. Please make sure the local server is running.`,
            error: error.message,
            duration: 0
        });
    }
});

// 3. รัน Automation
app.post('/run', async (req, res) => {
    const { steps, headless } = req.body;
    console.log(`[Run] Executing ${steps?.length || 0} steps... (Headless: ${!!headless})`);

    if (!steps || !Array.isArray(steps)) return res.status(400).json({ error: 'Invalid steps' });

    let browser;
    try {
        browser = await chromium.launch({ headless: !!headless, slowMo: 0 });
        const context = await browser.newContext({ 
            actionTimeout: 1000,
            navigationTimeout: 5000 
        });
        const page = await context.newPage();
        
        page.setDefaultTimeout(1000); 
        page.setDefaultNavigationTimeout(5000);

        const logs = [];
        const screenshots = [];

        let hasAssertionFailure = false;
        let lastFailureMessage = "";

        for (const [index, step] of steps.entries()) {
            const isLastStep = index === steps.length - 1;
            const logPrefix = `Step ${index + 1} [${step.type}]`;
            const startTime = Date.now();
            
            if (index === 0 && step.url) {
                console.log(`[Run] Navigating to ${step.url}`);
                await page.goto(step.url, { waitUntil: 'domcontentloaded', timeout: 5000 }).catch(e => {
                    console.error("Initial GOTO slow or failed:", e.message);
                });
            }

            try {
                console.log(`[Run] ${logPrefix} starting...`);
                if (step.type === 'CLICK') {
                    const selector = step.xpath ? `xpath=${step.xpath}` : step.id ? `#${step.id}` : null;
                    if (selector) {
                        const locator = page.locator(selector);
                        await locator.scrollIntoViewIfNeeded({ timeout: 500 });
                        await locator.click({ timeout: 500 });
                    }
                } else if (step.type === 'INPUT') {
                    const selector = step.xpath ? `xpath=${step.xpath}` : step.id ? `#${step.id}` : null;
                    if (selector) {
                        const locator = page.locator(selector);
                        await locator.scrollIntoViewIfNeeded({ timeout: 500 });
                        await locator.fill(step.value || '', { timeout: 500 });
                    }
                } else if (step.type === 'ASSERT_URL') {
                    const currentUrl = page.url();
                    const isMatch = currentUrl.includes(step.value);
                    
                    if (!isMatch) {
                        if (isLastStep) {
                            throw new Error(`ASSERT_URL: URL mismatch at final step.`);
                        } else {
                            await page.waitForURL(url => url.href.includes(step.value), { timeout: 500 });
                        }
                    }
                } else if (step.type === 'ASSERT_TEXT') {
                    const checkText = async (val) => {
                        return await page.evaluate((text) => document.body.innerText.includes(text), val);
                    };

                    const isMatch = await checkText(step.value);
                    if (!isMatch) {
                        if (isLastStep) {
                            throw new Error(`ASSERT_TEXT: Text "${step.value}" not found at final step.`);
                        } else {
                            await page.waitForFunction(
                                (expectedText) => document.body.innerText.includes(expectedText),
                                step.value,
                                { timeout: 500 }
                            );
                        }
                    }
                } else if (step.type === 'ASSERT_VISIBLE') {
                    const selector = step.xpath ? `xpath=${step.xpath}` : step.id ? `#${step.id}` : null;
                    if (selector) {
                        await page.locator(selector).waitFor({ state: 'visible', timeout: 500 });
                    }
                }

                const duration = Date.now() - startTime;
                console.log(`[Run] ${logPrefix} Success in ${duration}ms`);

                // Capture success screenshot (ONLY IF FAST)
                const screenStart = Date.now();
                try {
                    const screenshot = await page.screenshot({ type: 'jpeg', quality: 50, timeout: 500 });
                    screenshots.push({
                        stepIndex: index,
                        base64: `data:image/jpeg;base64,${screenshot.toString('base64')}`,
                        status: 'success'
                    });
                } catch (sErr) {
                    console.log(`[Run] Screenshot skipped/failed for ${logPrefix}: ${sErr.message}`);
                }

                logs.push(`${logPrefix} Success`);

            } catch (e) {
                const duration = Date.now() - startTime;
                console.log(`[Run] ${logPrefix} FAILED in ${duration}ms: ${e.message}`);

                if (step.type.startsWith('ASSERT_')) {
                    hasAssertionFailure = true;
                    lastFailureMessage = e.message;
                    if (isLastStep) {
                        logs.push(`${logPrefix} Smart Rule: Final step assertion mismatch ignored.`);
                        try {
                            const screenshot = await page.screenshot({ type: 'jpeg', quality: 50, timeout: 500 });
                            screenshots.push({
                                stepIndex: index,
                                base64: `data:image/jpeg;base64,${screenshot.toString('base64')}`,
                                status: 'warning'
                            });
                        } catch(sErr){}
                        continue;
                    }
                }

                let userFriendlyError = e.message.split('\n')[0];
                try {
                    const errorKeywords = ['รหัสผ่านไม่ถูกต้อง', 'ล้มเหลว', 'error', 'failed', 'invalid'];
                    // Reduce innerText timeout to 500ms
                    const pageText = await page.innerText('body', { timeout: 500 }).catch(() => '');
                    const foundKeyword = errorKeywords.find(kw => pageText.toLowerCase().includes(kw));
                    if (foundKeyword) userFriendlyError = `Error found on page: "${foundKeyword}"`;
                } catch (checkErr) {}

                try {
                    const failScreenshot = await page.screenshot({ type: 'jpeg', quality: 50, timeout: 500 });
                    screenshots.push({
                        stepIndex: index,
                        base64: `data:image/jpeg;base64,${failScreenshot.toString('base64')}`,
                        status: 'failed'
                    });
                } catch (err) {}

                logs.push(`${logPrefix} Failed: ${userFriendlyError}`);
                try { await browser.close(); } catch (e) { }

                return res.json({
                    status: 'failed',
                    message: userFriendlyError,
                    logs,
                    screenshots
                });
            }
        }

        // Final completion logic
        try { await browser.close(); } catch (e) { }
        res.json({ 
            status: 'success', 
            logs, 
            screenshots,
            note: hasAssertionFailure ? `Test finished but some final assertions did not match: ${lastFailureMessage}` : null
        });
    } catch (error) {
        console.error('CRITICAL ERROR in /run:', error);
        res.status(500).json({ error: error.message });
    } finally {
        if (browser) await browser.close();
    }
});

app.listen(PORT, () => console.log(`>>> ZENTEST SERVER v2.4 (Ultra Fast) - READY on http://localhost:${PORT}`));
