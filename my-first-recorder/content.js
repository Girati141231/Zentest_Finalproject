let recordingActive = false;
let lastStepTime = null;

const ui = document.createElement('div');
ui.innerHTML = `<span style="color:red; margin-right:5px; animation: blink 1s infinite;">●</span> Recording Test Step...`;
ui.style.cssText = "position:fixed; top:20px; left:50%; transform:translateX(-50%); background:rgba(0,0,0,0.8); color:white; padding:10px 20px; border-radius:20px; z-index:99999; display:none; font-family:sans-serif; box-shadow:0 4px 15px rgba(0,0,0,0.3); pointer-events:none;";
document.body.appendChild(ui);

const style = document.createElement('style');
style.textContent = "@keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }";
document.head.appendChild(style);

function getXPath(element) {
    if (!element) return '';
    if (element.id) return `//*[@id="${element.id}"]`;
    const stableAttrs = ['name', 'data-testid', 'data-id', 'placeholder', 'aria-label'];
    for (const attr of stableAttrs) {
        const value = element.getAttribute(attr);
        if (value) return `//${element.tagName.toLowerCase()}[@${attr}="${value}"]`;
    }
    const text = element.innerText?.trim();
    if ((element.tagName === 'BUTTON' || element.tagName === 'A') && text && text.length < 30 && !text.includes('\n')) {
        return `//${element.tagName.toLowerCase()}[contains(text(), "${text}")]`;
    }
    if (element === document.body) return '/html/body';
    let ix = 0;
    let siblings = element.parentNode.childNodes;
    for (let i = 0; i < siblings.length; i++) {
        let sibling = siblings[i];
        if (sibling === element) return getXPath(element.parentNode) + '/' + element.tagName.toLowerCase() + '[' + (ix + 1) + ']';
        if (sibling.nodeType === 1 && sibling.tagName === element.tagName) ix++;
    }
}

chrome.storage.local.get(['isRecording'], (result) => {
    recordingActive = !!result.isRecording;
    ui.style.display = recordingActive ? "block" : "none";
    if (recordingActive) lastStepTime = Date.now();
});

chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "toggle") {
        recordingActive = request.recording;
        ui.style.display = recordingActive ? "block" : "none";
        lastStepTime = recordingActive ? Date.now() : null;
    }
});

function saveStep(newStep) {
    if (!recordingActive) return;

    const currentTime = Date.now();
    const delay = lastStepTime ? currentTime - lastStepTime : 0;

    chrome.storage.local.get(['testSteps'], (result) => {
        let steps = result.testSteps || [];
        
        // Logic: ถ้าเป็น INPUT ที่ตัวเดิม ให้ทับค่าเดิม
        const lastStep = steps[steps.length - 1];
        const currentXPath = getXPath(newStep.targetElement);
        const isSameInput = lastStep && 
                          lastStep.type === "INPUT" && 
                          newStep.type === "INPUT" && 
                          (lastStep.id === newStep.id && lastStep.name === newStep.name && lastStep.xpath === currentXPath);

        if (isSameInput) {
            lastStep.value = newStep.value;
            lastStep.selectedText = newStep.selectedText;
        } else {
            const enrichedStep = {
                ...newStep,
                url: window.location.href,
                xpath: currentXPath,
                delay: delay,
                time: new Date().toLocaleTimeString()
            };
            delete enrichedStep.targetElement;
            steps.push(enrichedStep);
            lastStepTime = currentTime; 
        }

        chrome.storage.local.set({ testSteps: steps }, () => {
            chrome.runtime.sendMessage({ type: "DATA_UPDATED" }, () => {
                if (chrome.runtime.lastError) { /* Popup is closed */ }
            });
        });
    });
}

// 1. Click
document.addEventListener('click', (event) => {
    if (!recordingActive) return;
    saveStep({
        type: "CLICK",
        tagName: event.target.tagName,
        id: event.target.id,
        className: event.target.className,
        text: event.target.innerText?.substring(0, 30).trim() || "No text",
        targetElement: event.target
    });
}, true);

// 2. Input / Textarea / Select (Real-time)
document.addEventListener('input', (event) => {
    if (!recordingActive) return;
    const element = event.target;
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
        saveStep({
            type: "INPUT",
            tagName: element.tagName,
            id: element.id,
            name: element.name || "",
            placeholder: element.getAttribute('placeholder') || "",
            value: element.value,
            selectedText: element.tagName === 'SELECT' ? element.options[element.selectedIndex].text : "",
            targetElement: element
        });
    }
}, true);

// 3. Keydown (Enter)
document.addEventListener('keydown', (event) => {
    if (!recordingActive) return;
    if (event.key === 'Enter') {
        saveStep({
            type: "KEYDOWN",
            key: "Enter",
            tagName: event.target.tagName,
            id: event.target.id,
            targetElement: event.target
        });
    }
}, true);

// 4. Scroll (Debounce)
let scrollTimeout;
window.addEventListener('scroll', () => {
    if (!recordingActive) return;
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
        saveStep({
            type: "SCROLL",
            scrollX: window.scrollX,
            scrollY: window.scrollY,
            tagName: "WINDOW",
            targetElement: document.documentElement
        });
    }, 500);
}, true);