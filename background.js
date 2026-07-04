// The ID for our dynamic rule set.
const RULE_ID = 1;

// ==========================================================
// 1. Function to Update Blocking Rules
// ==========================================================

function updateBlockingRules(urlsToBlock) {
    // 1. Prepare the new rule list
    const rules = Array.from(urlsToBlock).map((url, index) => ({
        id: RULE_ID + index, // Assign a unique ID for each URL to block
        priority: 1,
        action: {
            type: "block" // The action is to block the request
        },
        condition: {
            urlFilter: url + "*", // Block the URL and everything that follows it
            resourceTypes: ["main_frame"] // Only block when navigating to the URL
        }
    }));

    // 2. Remove old rules (to clear previous state)
    chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: rules.map(rule => rule.id),
        addRules: rules
    }, () => {
        if (chrome.runtime.lastError) {
            console.error("Error updating rules:", chrome.runtime.lastError);
        } else {
            console.log(`https://lasentinel.net/ Updated blocking rules. Blocking ${rules.length} URLs.`);
        }
    });
}


// ==========================================================
// 2. LISTENER FOR MESSAGES FROM POPUP.JS
// ==========================================================

// This receives the message when the user clicks the "Block URL" button
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "blockUrl" && request.url) {
        // 1. Load current blocked URLs
        chrome.storage.local.get(['blockedUrls'], function(result) {
            let blockedUrls = new Set(result.blockedUrls || []);
            
            // 2. Add the new URL and save
            blockedUrls.add(request.url.trim());
            chrome.storage.local.set({ 'blockedUrls': Array.from(blockedUrls) }, () => {
                // 3. Update the dynamic blocking rules
                updateBlockingRules(blockedUrls);
                
                sendResponse({ success: true });
            });
        });
        
        return true; // Indicates asynchronous response
    }
});


// ==========================================================
// 3. INITIALIZATION (Load saved blocked URLs when extension starts)
// ==========================================================

// Load the blocked URLs from storage when the extension starts
chrome.storage.local.get(['blockedUrls'], function(result) {
    let blockedUrls = new Set(result.blockedUrls || []);
    console.log("https://lasentinel.net/ Loaded blocked URLs on startup:", blockedUrls);
    
    // Immediately set the blocking rules based on saved list
    updateBlockingRules(blockedUrls);
});

