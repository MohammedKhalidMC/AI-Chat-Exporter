document.addEventListener('DOMContentLoaded', () => {
  const statusDiv = document.getElementById('status');
  
  function setStatus(msg, type = '') {
    statusDiv.textContent = msg;
    statusDiv.className = type;
  }

  async function injectAndTrigger(format) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url.includes('chatgpt.com') && 
          !tab.url.includes('google.com') && // Gemini often under google.com
          !tab.url.includes('gemini.google.com') &&
          !tab.url.includes('kimi.moonshot.cn')) {
            setStatus('Not a supported AI chat site.', 'error');
            return;
      }

      setStatus('Injecting script...');
      
      // Inject the content script
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });

      setStatus(`Exporting to ${format}...`);
      
      // Send the command
      chrome.tabs.sendMessage(tab.id, { action: 'export', format: format }, (response) => {
        if (chrome.runtime.lastError) {
          setStatus('Error: ' + chrome.runtime.lastError.message, 'error');
        } else if (response && response.status === 'success') {
          setStatus('Export complete!', 'success');
        } else {
          setStatus('Export failed or cancelled.', 'error');
        }
      });
      
    } catch (err) {
      setStatus('Error: ' + err.message, 'error');
    }
  }

  document.getElementById('exportMD').addEventListener('click', () => injectAndTrigger('markdown'));
  document.getElementById('exportDOCX').addEventListener('click', () => injectAndTrigger('docx'));
  document.getElementById('exportPDF').addEventListener('click', () => injectAndTrigger('pdf'));
});