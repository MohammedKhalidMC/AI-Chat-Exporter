// --- ICONS (SVG Strings) ---
const ICONS = {
    pdf: '<svg viewBox="0 0 24 24"><path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"/></svg>',
    word: '<svg viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>',
    md: '<svg viewBox="0 0 24 24"><path d="M20.56 18H3.44C2.65 18 2 17.37 2 16.59V7.41C2 6.63 2.65 6 3.44 6h17.12C21.35 6 22 6.63 22 7.41v9.18c0 .78-.65 1.41-1.44 1.41zM7.5 14h2v-4l2.5 2.5 2.5-2.5v4h2V8H14l-2.5 2.5L9 8H7.5v6z"/></svg>',
    copy: '<svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>'
};

// --- CONFIGURATION ---
const PLATFORMS = {
    chatgpt: {
        // The container of a single AI response
        messageSelector: '.group\\/conversation-turn', 
        // Where to insert our toolbar within that container
        actionSelector: '.text-token-text-secondary, .text-gray-400', 
        // The actual text content to export
        contentSelector: '.markdown',
        name: 'ChatGPT'
    },
    gemini: {
        messageSelector: '.model-response-text', // Or the container wrapping it
        actionSelector: '.model-response-text', // We append to the bottom of the text div
        contentSelector: '.model-response-text',
        name: 'Gemini'
    },
    kimi: {
        messageSelector: 'div[class*="messageItem_"]', // Heuristic for Kimi React classes
        actionSelector: 'div[class*="actions_"]',
        contentSelector: '.markdown-body',
        name: 'Kimi'
    }
};

function getPlatform() {
    const host = window.location.hostname;
    if (host.includes('chatgpt.com')) return PLATFORMS.chatgpt;
    if (host.includes('gemini.google.com')) return PLATFORMS.gemini;
    if (host.includes('kimi.moonshot.cn')) return PLATFORMS.kimi;
    return null;
}

// --- EXPORT FUNCTIONS ---

function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function exportToPDF(element, filename) {
    // We clone the node to print just this message
    const clone = element.cloneNode(true);
    
    // Create an iframe to print
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    // Basic styles for the print view
    const css = `
        <style>
            body { font-family: sans-serif; padding: 20px; line-height: 1.6; color: #333; }
            img { max-width: 100%; }
            pre { background: #f4f4f4; padding: 10px; border-radius: 5px; white-space: pre-wrap; }
            code { font-family: monospace; background: #eee; padding: 2px 4px; border-radius: 3px; }
            table { border-collapse: collapse; width: 100%; margin: 10px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .ai-export-toolbar, 
            .source-container, 
            button, 
            [role="button"] { 
                display: none !important; 
            }
        </style>
    `;

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`<html><head><title>${filename}</title>${css}</head><body>${clone.innerHTML}</body></html>`);
    doc.close();

    // Wait for images/resources then print
    setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => document.body.removeChild(iframe), 2000);
    }, 500);
}

async function exportToDOCX(element, filename) {
    // HTML-to-Word using html-docx.js.
    const clone = element.cloneNode(true);
    
    // 1. Remove Extension Toolbars
    clone.querySelectorAll('.ai-export-toolbar').forEach(tb => tb.remove());

    // 2. Fix BOLD and ITALIC (Force them so Word understands)
    clone.querySelectorAll('strong, b').forEach(el => {
        el.style.fontWeight = 'bold';
        el.style.color = '#000000'; // Force black to avoid weird grey bolds
    });
    clone.querySelectorAll('em, i').forEach(el => {
        el.style.fontStyle = 'italic';
    });

    // 3. Fix INLINE Code (e.g. `const x`)
    // We select code tags that are NOT inside pre tags
    const inlineCodes = clone.querySelectorAll(':not(pre) > code');
    inlineCodes.forEach(el => {
        el.style.fontFamily = '"Courier New", Courier, monospace';
        el.style.fontSize = '10pt';        // Force a stable size
        el.style.backgroundColor = '#f4f4f4'; // Light grey background
        el.style.padding = '2px 4px';      // Small padding
        el.style.borderRadius = '3px';
        el.style.border = '1px solid #e0e0e0'; // Subtle border
        el.style.color = '#333333';        // Standard "code pink" color (or change to #333 for black)
    });

    // 4. Fix BLOCK Code (e.g. ```javascript ...)
    const preBlocks = clone.querySelectorAll('pre');
    preBlocks.forEach(el => {
        el.style.fontFamily = '"Courier New", Courier, monospace';
        el.style.fontSize = '9.5pt';
        el.style.backgroundColor = '#f8f9fa';
        el.style.border = '1px solid #ccc';
        el.style.padding = '10px';
        el.style.marginBottom = '15px';
        el.style.whiteSpace = 'pre-wrap';  // Crucial: Makes code wrap in Word instead of running off page
        el.style.overflowWrap = 'break-word';
        
        // Fix inner code tag inside the pre
        const innerCode = el.querySelector('code');
        if (innerCode) {
            innerCode.style.fontFamily = 'inherit'; // Inherit Courier
            innerCode.style.backgroundColor = 'transparent'; // No double background
            innerCode.style.padding = '0';
            innerCode.style.border = 'none';
            innerCode.style.color = '#24292e'; // Dark text base
        }
    });

    // 5. Syntax Highlighting (Color Only)
    // We steal ONLY the color from the screen, ignoring messy margins/fonts
    const originalCodes = element.querySelectorAll('pre code span');
    const cloneCodes = clone.querySelectorAll('pre code span');

    if (originalCodes.length === cloneCodes.length) {
        for (let i = 0; i < originalCodes.length; i++) {
            const computed = window.getComputedStyle(originalCodes[i]);
            // ONLY copy the color to avoid layout breakage
            cloneCodes[i].style.color = computed.color;
            // Copy bold if it exists (for keywords)
            if (computed.fontWeight === '700' || computed.fontWeight === 'bold') {
                cloneCodes[i].style.fontWeight = 'bold';
            }
        }
    }

    // 6. Wrap in clean HTML structure
    const fullHtml = `
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: 'Calibri', sans-serif; font-size: 11pt; line-height: 1.5; color: #333; }
                    h1, h2, h3 { color: #2c3e50; margin-top: 15px; margin-bottom: 10px; }
                    p { margin-bottom: 12px; }
                    ul, ol { margin-bottom: 12px; padding-left: 30px; }
                    li { margin-bottom: 5px; }
                    /* Table Styles for Word */
                    table { border-collapse: collapse; width: 100%; margin: 15px 0; }
                    th { background-color: #e9ecef; border: 1px solid #adb5bd; padding: 8px; font-weight: bold; text-align: left; }
                    td { border: 1px solid #dee2e6; padding: 8px; }
                </style>
            </head>
            <body>
                ${clone.innerHTML}
            </body>
        </html>
    `;
    
    if (!window.htmlDocx) {
        alert("Error: 'html-docx.js' library not found.");
        return;
    }

    try {
        const docxBlob = window.htmlDocx.asBlob(fullHtml);
        downloadFile(filename + '.docx', docxBlob, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    } catch (error) {
        console.error("Word Export Failed:", error);
        alert("Export failed: " + error.message);
    }
}

function exportToMarkdown(element, filename) {
    // Complex HTML to Markdown parser using Turndown
    const clone = element.cloneNode(true);
    const toolbar = clone.querySelector('.ai-export-toolbar');
    if (toolbar) toolbar.remove();
    const turndownService = new TurndownService();
    let md = turndownService.turndown(clone.innerHTML);
    downloadFile(filename + '.md', md, 'text/markdown');
}

// --- MAIN INJECTION LOGIC ---

function createButton(text, iconHtml, onClick) {
    const btn = document.createElement('button');
    btn.className = 'ai-export-btn';
    btn.innerHTML = `${iconHtml} <span>${text}</span>`;
    btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
    };
    return btn;
}

function injectToolbars() {
    const config = getPlatform();
    if (!config) return;

    // Find all message containers
    const messages = document.querySelectorAll(config.messageSelector);

    messages.forEach((msgNode) => {
        // Prevent double injection
        if (msgNode.dataset.aiExporterInjected === 'true') return;
        
        // Ensure this is actually an AI response (simplified check)
        // For Gemini, we might need stricter checks
        
        const contentNode = msgNode.querySelector(config.contentSelector) || msgNode;
        
        // Find where to append. 
        // 1. Try specific action bar
        // 2. Fallback to appending to the message itself
        let targetContainer = msgNode.querySelector(config.actionSelector);
        if (!targetContainer) targetContainer = msgNode;

        // Create Toolbar
        const toolbar = document.createElement('div');
        toolbar.className = 'ai-export-toolbar';
        
        // Timestamp for unique filenames
        const getFilename = () => `AI-Chat-${new Date().getTime()}`;

        // PDF Button
        toolbar.appendChild(createButton('PDF', ICONS.pdf, () => {
            exportToPDF(contentNode, getFilename());
        }));

        // DOCX Button
        toolbar.appendChild(createButton('Word', ICONS.word, () => {
            exportToDOCX(contentNode, getFilename());
        }));
        
        // MD Button
        toolbar.appendChild(createButton('MD', ICONS.md, () => {
            exportToMarkdown(contentNode, getFilename());
        }));

        // Append to UI
        if (config.name === 'ChatGPT') {
            // ChatGPT needs careful insertion or it breaks layout
            targetContainer.parentElement.appendChild(toolbar);
        } else {
            targetContainer.appendChild(toolbar);
        }
        
        // Mark as processed
        msgNode.dataset.aiExporterInjected = 'true';
    });
}

// --- OBSERVER ---
// Watch for new messages appearing in the DOM
const observer = new MutationObserver((mutations) => {
    // Debounce slightly could be good, but direct call is usually fine for UI updates
    injectToolbars();
});

// Start observing
observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Initial run
setTimeout(injectToolbars, 1000);