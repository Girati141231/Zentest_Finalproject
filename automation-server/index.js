import express from 'express';
import cors from 'cors';
import { chromium } from 'playwright';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, getDoc, doc, query, where, Timestamp, deleteDoc } from 'firebase/firestore';

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

// 0. Verify & Get Project (สำหรับ Extension)
app.post('/projects', async (req, res) => {
    const { apiKey } = req.body; // apiKey คือ ID ของโปรเจกต์
    console.log(`[Extension] Requesting Project ID: ${apiKey}`);
    
    if (!apiKey) return res.status(400).json({ error: 'Project ID is required' });

    try {
        await ensureAuth();
        // Path matches Rules: /artifacts/{appId}/public/data/projects/{projectId}
        const docRef = doc(db, 'artifacts', APP_ID, 'public', 'data', 'projects', apiKey);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            console.log(`[Extension] Project Found: ${docSnap.data().name}`);
            res.json({ 
                projects: [{
                    id: docSnap.id,
                    name: docSnap.data().name || 'Unnamed Project'
                }]
            });
        } else {
            console.warn(`[Extension] Project NOT Found at path: artifacts/${APP_ID}/public/data/projects/${apiKey}`);
            res.status(404).json({ error: 'Project not found in Zentest database' });
        }
    } catch (error) {
        console.error('CRITICAL ERROR in /projects:', error);
        res.status(500).json({ error: 'Local Server Error: ' + error.message });
    }
});

// 1. บันทึก Automation 
app.post('/save-automation', async (req, res) => {
    const { steps, apiKey, projectId, folderName, scenarioName } = req.body;
    console.log(`[Sync] Saving script: ${scenarioName} to Folder: ${folderName}`);
    
    if (!steps || !projectId || !folderName || !scenarioName) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        await ensureAuth();
        // Path matches Rules: /artifacts/{appId}/public/data/automationLibrary
        const libRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'automationLibrary');
        const docRef = await addDoc(libRef, {
            projectId,
            folderName,
            scenarioName,
            steps,
            createdBy: apiKey,
            createdAt: Date.now(),
            timestamp: Timestamp.now()
        });
        
        console.log(`[Sync] SUCCESS! Saved with ID: ${docRef.id}`);
        res.json({ status: 'success', id: docRef.id });
    } catch (error) {
        console.error('CRITICAL ERROR in /save-automation:', error);
        res.status(500).json({ error: 'Failed to save to Firestore: ' + error.message });
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

// 3. รัน Automation
app.post('/run', async (req, res) => {
    const { steps } = req.body;
    console.log(`[Run] Executing ${steps?.length || 0} steps...`);
    
    if (!steps || !Array.isArray(steps)) return res.status(400).json({ error: 'Invalid steps' });

    let browser;
    try {
        browser = await chromium.launch({ headless: false, slowMo: 100 });
        const context = await browser.newContext();
        const page = await context.newPage();
        const logs = [];
        const screenshots = [];

        for (const [index, step] of steps.entries()) {
            const logPrefix = `Step ${index + 1} [${step.type}]`;
            if (index === 0 && step.url) {
                await page.goto(step.url, { waitUntil: 'domcontentloaded' });
            }

            try {
                if (step.type === 'CLICK') {
                    const selector = step.xpath ? `xpath=${step.xpath}` : step.id ? `#${step.id}` : null;
                    if (selector) {
                        const locator = page.locator(selector);
                        await locator.scrollIntoViewIfNeeded();
                        await locator.click({ timeout: 5000 });
                    }
                } else if (step.type === 'INPUT') {
                    const selector = step.xpath ? `xpath=${step.xpath}` : step.id ? `#${step.id}` : null;
                    if (selector) {
                        const locator = page.locator(selector);
                        await locator.scrollIntoViewIfNeeded();
                        await locator.fill(step.value || '');
                    }
                } else if (step.type === 'ASSERT_URL') {
                    const currentUrl = page.url();
                    console.log(`[Assert] Checking URL... Expected to contain: "${step.value}" | Current: "${currentUrl}"`);
                    
                    // Instant check first
                    if (currentUrl.includes(step.value)) {
                        console.log('[Assert] URL Match (Instant)');
                    } else {
                        // Wait if not immediately matching (Reduced to 20s)
                        await page.waitForURL(url => url.href.includes(step.value), { timeout: 20000 });
                        console.log('[Assert] URL Match (After Wait)');
                    }
                } else if (step.type === 'ASSERT_VISIBLE') {
                    const selector = step.xpath ? `xpath=${step.xpath}` : step.id ? `#${step.id}` : null;
                    if (selector) {
                        console.log(`[Assert] Waiting for element: ${selector}`);
                        await page.locator(selector).waitFor({ state: 'visible', timeout: 10000 });
                    }
                }

                // Capture success screenshot (safely)
                try {
                    const screenshot = await page.screenshot({ type: 'jpeg', quality: 60 });
                    screenshots.push({
                        stepIndex: index,
                        base64: `data:image/jpeg;base64,${screenshot.toString('base64')}`,
                        status: 'success'
                    });
                } catch (screenErr) {
                    console.warn(`[Screenshot] Failed to capture step ${index}:`, screenErr.message);
                }

                logs.push(`${logPrefix} Success`);
            } catch (e) {
                // Intelligent bug detection
                let userFriendlyError = e.message.split('\n')[0];
                try {
                    const errorKeywords = ['รหัสผ่านไม่ถูกต้อง', 'ไม่ถูกต้อง', 'ล้มเหลว', 'error', 'failed', 'invalid', 'incorrect', 'wrong'];
                    // Use a shorter timeout to check body text if failing
                    const pageText = await page.innerText('body', { timeout: 2000 }).catch(() => '');
                    const foundKeyword = errorKeywords.find(kw => pageText.toLowerCase().includes(kw));
                    
                    if (foundKeyword) {
                        userFriendlyError = `ตรวจพบข้อความแจ้งเตือนบนหน้าจอ: "${foundKeyword}" (อาจจะเป็นสาเหตุที่ทำให้เทสไม่ผ่าน)`;
                    } else if (userFriendlyError.includes('Timeout')) {
                        userFriendlyError = `ระบบใช้เวลานานเกินไป (Timeout) อาจเกิดจากขั้นตอนก่อนหน้าทำงานไม่สำเร็จ หรือหน้าจอไม่เปลี่ยนตามที่คาดหวัง`;
                    }
                } catch (checkErr) { /* fallback to original error */ }

                try {
                   const failScreenshot = await page.screenshot({ type: 'jpeg', quality: 60 });
                   screenshots.push({
                       stepIndex: index,
                       base64: `data:image/jpeg;base64,${failScreenshot.toString('base64')}`,
                       status: 'failed'
                   });
                } catch (screenErr) {
                    console.warn(`[Screenshot] Failed to capture failure at step ${index}:`, screenErr.message);
                }

                logs.push(`${logPrefix} Failed: ${userFriendlyError}`);
                // Close browser on failure
                try { await browser.close(); } catch (e) {}

                res.json({ 
                    status: 'failed', 
                    message: userFriendlyError, 
                    logs,
                    screenshots 
                });
                return;
            }
        }
        
        // Close browser immediately on success
        try { await browser.close(); } catch (e) {}
        
        res.json({ status: 'success', logs, screenshots });
    } catch (error) {
        console.error('CRITICAL ERROR in /run:', error);
        res.status(500).json({ error: error.message });
    } finally {
        if (browser) await browser.close();
    }
});

app.listen(PORT, () => console.log(`>>> ZENTEST SERVER v2.3 - READY on http://localhost:${PORT}`));
