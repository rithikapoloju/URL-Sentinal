const API_URL = 'http://127.0.0.1:5000/predict'; 

document.addEventListener('DOMContentLoaded', () => {
    const urlInput = document.getElementById('urlInput');
    const checkButton = document.getElementById('checkButton');
    const statusBox = document.getElementById('statusBox');
    const blockButton = document.getElementById('blockButton');

    checkButton.addEventListener('click', checkPastedUrl);

    // Initial state: hide block button
    blockButton.style.display = 'none';

    // Handler for clicking the Block button
    blockButton.addEventListener('click', () => {
        const urlToBlock = urlInput.value.trim();
        if (urlToBlock) {
            // Send message to the background script to save and block this URL
            chrome.runtime.sendMessage({ action: "blockUrl", url: urlToBlock }, (response) => {
                if (response && response.success) {
                    statusBox.textContent = `SUCCESS: ${urlToBlock} is now blocked!`;
                    statusBox.className = 'result-box malicious';
                    blockButton.style.display = 'none';
                }
            });
        }
    });


    async function checkPastedUrl() {
        const currentUrl = urlInput.value.trim();
        statusBox.textContent = 'Checking...';
        statusBox.className = 'result-box checking';
        blockButton.style.display = 'none'; // Hide button while checking

        if (!currentUrl) {
            statusBox.textContent = 'Please enter a URL.';
            return;
        }
        
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: currentUrl })
            });

            if (!response.ok) {
                statusBox.textContent = `API Error: ${response.status} ${response.statusText}`;
                statusBox.className = 'result-box checking';
                return;
            }

            const data = await response.json();
            
            const isPhishing = data.is_phishing;
            const confidence = data.confidence || 0;
            
            // 5. Update the UI and display the Block button if MALICIOUS
            if (isPhishing) {
                statusBox.textContent = `MALICIOUS! (Risk: ${confidence.toFixed(2)}%)`;
                statusBox.className = 'result-box malicious';
                blockButton.style.display = 'block'; // SHOW THE BLOCK BUTTON
            } else {
                statusBox.textContent = `LEGITIMATE (Risk: ${confidence.toFixed(2)}%)`;
                statusBox.className = 'result-box legitimate';
                blockButton.style.display = 'none';
            }

        } catch (error) {
            statusBox.textContent = 'Network Error: Could not connect to API.';
            statusBox.className = 'result-box checking';
            console.error('Network Error:', error);
        }
    }
});




