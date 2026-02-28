let isRecording = false;
const btn = document.getElementById('toggleBtn');
const statusText = document.getElementById('status');
const logList = document.getElementById('logList');
const stepCountText = document.getElementById('stepCount');

// โหลดข้อมูลเดิม
chrome.storage.local.get(['isRecording', 'testSteps', 'apiKey', 'selectedProjectId', 'projects', 'lastFolder', 'lastScenario'], (result) => {
    isRecording = !!result.isRecording;
    if (result.apiKey) {
        document.getElementById('apiKeyInput').value = result.apiKey;
        // Auto-fetch projects to keep them real-time
        fetchProjects(result.apiKey);
    }
    if (result.projects) updateProjectDropdown(result.projects, result.selectedProjectId);
    
    // Load current typing state or fallback to last saved
    if (result.lastFolder) document.getElementById('folderNameInput').value = result.lastFolder;
    if (result.lastScenario) document.getElementById('scenarioNameInput').value = result.lastScenario;
    
    updateDisplay(); 
    updateButtonUI();
});

// Helper function to fetch projects from server
async function fetchProjects(key) {
    if (!key) return;
    try {
        const response = await fetch('http://localhost:3002/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey: key })
        });
        const data = await response.json();
        if (response.ok && data.projects) {
            const currentSelection = document.getElementById('projectSelect').value;
            chrome.storage.local.set({ projects: data.projects });
            updateProjectDropdown(data.projects, currentSelection);
            if (currentSelection) fetchModules(currentSelection);
        }
    } catch (err) {
        console.error('Auto-sync failed:', err);
    }
}

// Fetch Modules for Project
async function fetchModules(projectId) {
    if (!projectId) return;
    try {
        const response = await fetch(`http://localhost:3002/modules/${projectId}`);
        const data = await response.json();
        if (response.ok && data.modules) {
            updateModuleDropdown(data.modules);
        }
    } catch (err) {
        console.error('Failed to fetch modules:', err);
    }
}

function updateModuleDropdown(modules) {
    const select = document.getElementById('moduleSelect');
    const folderInput = document.getElementById('folderNameInput');
    
    // Clear and add only project modules
    let html = '<option value="">-- SELECT PROJECT MODULE --</option>';
    if (modules && modules.length > 0) {
        html += modules.map(m => `<option value="${m.name}">${m.name}</option>`).join('');
    } else {
        html = '<option value="">-- NO MODULES IN PROJECT --</option>';
    }
    select.innerHTML = html;

    // Restore dropdown selection. The folderInput is already handled by initial storage load.
    chrome.storage.local.get(['lastModule'], (result) => {
        if (result.lastModule && modules.some(m => m.name === result.lastModule)) {
            select.value = result.lastModule;
        }
    });
}

document.getElementById('moduleSelect').addEventListener('change', (e) => {
    const val = e.target.value;
    if (!val) return; // Prevent overwriting with empty placeholder
    const folderInput = document.getElementById('folderNameInput');
    folderInput.value = val;
    chrome.storage.local.set({ lastModule: val, lastFolder: val });
});

// Real-time persistence for input fields
document.getElementById('folderNameInput').addEventListener('input', (e) => {
    const val = e.target.value;
    chrome.storage.local.set({ lastFolder: val });
    
    // If user starts typing, reset the dropdown so it doesn't conflict
    const select = document.getElementById('moduleSelect');
    if (select.value !== '' && select.value !== val) {
        select.value = '';
        chrome.storage.local.set({ lastModule: '' });
    }
});

document.getElementById('scenarioNameInput').addEventListener('input', (e) => {
    chrome.storage.local.set({ lastScenario: e.target.value });
});

document.getElementById('settingsBtn').addEventListener('click', () => {
    const panel = document.getElementById('settingsPanel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
});

document.getElementById('configToggle').addEventListener('click', () => {
    const content = document.getElementById('configContent');
    const icon = document.getElementById('toggleIcon');
    const isCollapsed = content.style.maxHeight === '0px';
    
    content.style.maxHeight = isCollapsed ? '500px' : '0px';
    content.style.marginTop = isCollapsed ? '16px' : '0px';
    icon.style.transform = isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)';
});

document.getElementById('saveKeyBtn').addEventListener('click', async () => {
    const key = document.getElementById('apiKeyInput').value;
    if (!key) return alert('System Requirement: Valid Project Key is mandatory.');
    const saveBtn = document.getElementById('saveKeyBtn');
    saveBtn.textContent = '⏱ Synching Context...';
    try {
        const response = await fetch('http://localhost:3002/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey: key })
        });
        const data = await response.json();
        if (response.ok) {
            chrome.storage.local.set({ apiKey: key, projects: data.projects });
            updateProjectDropdown(data.projects);
            alert('Authentication Success: Context Linked.');
            document.getElementById('settingsPanel').style.display = 'none';
        } else {
            alert('Authentication Failure: ' + data.error);
        }
    } catch (err) { alert('Network Error: Deployment Engine Unreachable (Port 3002)'); }
    finally { saveBtn.textContent = 'Verify & Deploy Link'; }
});

document.getElementById('togglePassword').addEventListener('click', () => {
    const passwordInput = document.getElementById('apiKeyInput');
    const eyeIcon = document.getElementById('eyeIcon');
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    // Change icon based on state
    if (type === 'password') {
        eyeIcon.innerHTML = `
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        `;
    } else {
        eyeIcon.innerHTML = `
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
        `;
    }
});

function updateProjectDropdown(projects, selectedId) {
    const select = document.getElementById('projectSelect');
    select.innerHTML = '<option value="">-- NO ACTIVE CONTEXT --</option>' + 
        projects.map(p => `<option value="${p.id}" ${p.id === selectedId ? 'selected' : ''}>${p.name}</option>`).join('');
}

document.getElementById('projectSelect').addEventListener('change', (e) => {
    const projectId = e.target.value;
    const folderInput = document.getElementById('folderNameInput');
    const moduleSelect = document.getElementById('moduleSelect');
    
    // Reset selections and inputs
    folderInput.value = '';
    moduleSelect.value = '';
    chrome.storage.local.set({ 
        selectedProjectId: projectId, 
        lastModule: '', 
        lastFolder: '' 
    });
    
    if (projectId) fetchModules(projectId);
});

function updateDisplay() {
    chrome.storage.local.get(['testSteps'], (result) => {
        const logs = result.testSteps || [];
        stepCountText.textContent = logs.length;
        if (logs.length === 0) {
            logList.innerHTML = '<div style="color:rgba(255,255,255,0.2); text-align:center; padding:20px; font-size:10px;">Waiting for node initialization...</div>';
            return;
        }
        logList.innerHTML = logs.map((step, index) => {
            let detail = step.tagName;
            if (step.type === 'INPUT') detail = `"${step.value}"`;
            else if (step.type === 'CLICK' && step.text !== "No text") detail = step.text;
            
            return `
                <div class="log-item">
                    <span class="step-prefix">#${index + 1}</span>
                    <b>${step.type}</b>
                    <span class="step-val">: ${detail}</span>
                </div>
            `;
        }).join('');
    });
}

btn.addEventListener('click', async () => {
    isRecording = !isRecording;
    chrome.storage.local.set({ isRecording: isRecording });
    updateButtonUI();
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) chrome.tabs.sendMessage(tab.id, { action: "toggle", recording: isRecording });
});

function updateButtonUI() {
    if (isRecording) {
        btn.textContent = 'Terminate Capture';
        btn.classList.add('recording');
        statusText.textContent = 'Capturing...';
        statusText.classList.add('capturing');
    } else {
        btn.textContent = 'Initialize Capture';
        btn.classList.remove('recording');
        statusText.textContent = 'Standby';
        statusText.classList.remove('capturing');
    }
}

document.getElementById('clearBtn').addEventListener('click', () => {
    if(confirm('System Warning: All captured nodes will be purged. Proceed?')) chrome.storage.local.set({ testSteps: [] }, () => updateDisplay());
});

document.getElementById('exportBtn').addEventListener('click', () => {
    chrome.storage.local.get(['testSteps'], (result) => {
        const data = JSON.stringify(result.testSteps, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `manifest-${Date.now()}.json`;
        a.click();
    });
});

// ฟังก์ชั่นส่งข้อมูลไปบันทึกในฐานข้อมูลระบบ
document.getElementById('syncBtn').addEventListener('click', async () => {
    const folder = document.getElementById('folderNameInput').value;
    const scenario = document.getElementById('scenarioNameInput').value;
    const moduleName = document.getElementById('moduleSelect').value;
    
    if (!folder || !scenario) return alert('Configuration Required: Module Path and Suite Identifier must be specified.');

    chrome.storage.local.get(['testSteps', 'apiKey', 'selectedProjectId'], async (result) => {
        if (!result.testSteps?.length) return alert('Deployment Failed: No nodes detected in manifest.');
        if (!result.selectedProjectId) return alert('Deployment Failed: Target Environment context not set.');

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        let finalSteps = [...(result.testSteps || [])];
        
        // Smart Injection: Detect login and add assertion based on final URL
        const isLogin = scenario.toLowerCase().includes('login') || finalSteps.some(s => s.name === 'password' || s.placeholder?.toLowerCase().includes('password'));
        const hasAssertion = finalSteps.some(s => s.type.startsWith('ASSERT_'));

        if (isLogin && !hasAssertion && tab) {
            finalSteps.push({
                type: 'ASSERT_URL',
                value: tab.url,
                note: 'Auto-detected login success criteria from recording end state'
            });
        }

        const btn = document.getElementById('syncBtn');
        btn.textContent = '⏳ Deploying Manifest...';
        btn.disabled = true;

        try {
            const response = await fetch('http://localhost:3002/save-automation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    steps: finalSteps,
                    apiKey: result.apiKey,
                    projectId: result.selectedProjectId,
                    folderName: folder,
                    moduleName: moduleName,
                    scenarioName: scenario
                })
            });

            if (response.ok) {
                const resData = await response.json();
                alert(`Deployment Success: Synchronized under [${resData.finalFolder || folder}]`);
            } else {
                alert('Deployment Failure: Server rejected the manifest.');
            }
        } catch (error) { alert('Network Error: Connectivity lost while deploying.'); }
        finally { btn.textContent = 'Deploy to Zentest'; btn.disabled = false; }
    });
});

chrome.runtime.onMessage.addListener((request) => { if (request.type === "DATA_UPDATED") updateDisplay(); });